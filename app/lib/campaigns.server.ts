import type { ReactElement } from "react";
import { render } from "@react-email/render";
import { getResend } from "~/lib/resend.server";
import { supabase } from "~/lib/supabase.server";
import {
  getCampaign,
  getCampaignContent,
  updateCampaign,
  createCampaignLog,
  getActiveSubscribers,
  getSubscribersByTags,
} from "~/data/queries.server";
import { NewCollectionEmail } from "~/emails/new-collection";
import { FlashSaleEmail } from "~/emails/flash-sale";
import { ProductLaunchEmail } from "~/emails/product-launch";

// ─── Template registry ──────────────────────────────────────────

const templateMap: Record<string, (props: any) => ReactElement> = {
  "new-collection": NewCollectionEmail,
  "flash-sale": FlashSaleEmail,
  "product-launch": ProductLaunchEmail,
};

const BATCH_SIZE = 50;
const STUCK_SENDING_MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours

export interface SendCampaignResult {
  campaignId: string;
  /** false = the campaign was not in a sendable status (or another worker claimed it) */
  claimed: boolean;
  status?: "sent" | "failed";
  totalSent?: number;
  totalFailed?: number;
  error?: string;
}

// ─── Atomic claim ───────────────────────────────────────────────

/**
 * Compare-and-set claim: flips the campaign to "sending" only if its current
 * status is one of `fromStatuses`. Returns false when no row was updated —
 * either the status didn't match or another worker already claimed it.
 */
export async function claimCampaign(
  campaignId: string,
  fromStatuses: string[],
): Promise<boolean> {
  const { data, error } = await supabase
    .from("email_campaigns")
    .update({ status: "sending", updated_at: new Date().toISOString() })
    .eq("id", campaignId)
    .in("status", fromStatuses)
    .select("id");
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

// ─── Send engine (shared by cron, API endpoint, and inline "Send now") ──

export async function sendCampaign(
  campaignId: string,
  options: { claimFrom?: string[] } = {},
): Promise<SendCampaignResult> {
  const claimFrom = options.claimFrom ?? ["scheduled"];
  const startedAt = new Date().toISOString();

  // 1. Atomically claim the campaign so concurrent runs can't double-send.
  let claimed: boolean;
  try {
    claimed = await claimCampaign(campaignId, claimFrom);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[campaigns] Failed to claim campaign ${campaignId}:`, error);
    return { campaignId, claimed: false, error: `Failed to claim campaign: ${message}` };
  }
  if (!claimed) {
    return {
      campaignId,
      claimed: false,
      error: `Campaign is not in a sendable status (expected one of: ${claimFrom.join(", ")})`,
    };
  }

  const failCampaign = async (message: string): Promise<SendCampaignResult> => {
    console.error(`[campaigns] Campaign ${campaignId} failed: ${message}`);
    const finishedAt = new Date().toISOString();
    try {
      await updateCampaign(campaignId, { status: "failed" });
      await createCampaignLog({
        campaignId,
        totalSent: 0,
        totalFailed: 0,
        startedAt,
        finishedAt,
        errorDetails: message,
      });
    } catch (logError) {
      console.error(`[campaigns] Failed to record failure for ${campaignId}:`, logError);
    }
    return { campaignId, claimed: true, status: "failed", totalSent: 0, totalFailed: 0, error: message };
  };

  try {
    // 2. Load and validate everything needed to send.
    const campaign = await getCampaign(campaignId);
    if (!campaign) return failCampaign("Campaign not found");
    if (!campaign.subject?.trim()) return failCampaign("Campaign has no subject line");

    const content = await getCampaignContent(campaignId);
    if (!content?.variables) return failCampaign("Campaign has no content");

    const componentName = campaign.email_templates?.component_name;
    const Component = componentName ? templateMap[componentName] : undefined;
    if (!Component) return failCampaign(`Unknown or missing template: ${componentName ?? "(none)"}`);

    const targetTags: string[] = campaign.target_tags || [];
    const subscribers =
      targetTags.length > 0
        ? await getSubscribersByTags(targetTags)
        : await getActiveSubscribers();
    if (subscribers.length === 0) return failCampaign("No subscribers match the campaign target");

    // 3. Render once, send in batches. Resend v6 does NOT throw — it returns
    //    { data, error }, so every batch's error field must be inspected.
    const renderedHtml = await render(Component(content.variables as Record<string, any>));
    const resend = getResend();
    const from =
      process.env.RESEND_FROM_EMAIL || "Flow Urban Wear <contact@flowurbanwear.com>";

    let totalSent = 0;
    let totalFailed = 0;
    const batchErrors: string[] = [];

    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE).map((sub) => ({
        from,
        to: sub.email,
        subject: campaign.subject,
        html: renderedHtml,
      }));

      try {
        const { error } = await resend.batch.send(batch);
        if (error) {
          totalFailed += batch.length;
          batchErrors.push(`Batch at offset ${i} (${batch.length} emails): ${error.message}`);
          console.error(
            `[campaigns] Resend batch error for campaign ${campaignId} at offset ${i}:`,
            error,
          );
        } else {
          totalSent += batch.length;
        }
      } catch (batchError) {
        // Network/unexpected errors can still throw.
        const message = batchError instanceof Error ? batchError.message : String(batchError);
        totalFailed += batch.length;
        batchErrors.push(`Batch at offset ${i} (${batch.length} emails): ${message}`);
        console.error(
          `[campaigns] Unexpected batch error for campaign ${campaignId} at offset ${i}:`,
          batchError,
        );
      }
    }

    // 4. Record reality: "sent" only if at least one email went out.
    const finishedAt = new Date().toISOString();
    const status: "sent" | "failed" = totalSent > 0 ? "sent" : "failed";
    const errorDetails =
      batchErrors.length > 0 ? batchErrors.slice(0, 10).join("\n") : undefined;

    await createCampaignLog({
      campaignId,
      totalSent,
      totalFailed,
      startedAt,
      finishedAt,
      errorDetails,
    });
    await updateCampaign(
      campaignId,
      status === "sent" ? { status, sentAt: finishedAt } : { status },
    );

    return {
      campaignId,
      claimed: true,
      status,
      totalSent,
      totalFailed,
      error: batchErrors.length > 0 ? batchErrors[0] : undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return failCampaign(message);
  }
}

// ─── Stuck-campaign recovery ────────────────────────────────────

/**
 * Marks campaigns stuck in "sending" for longer than `maxAgeMs` as "failed"
 * (a crash mid-send leaves them stranded otherwise). Uses updated_at as the
 * claim timestamp — claimCampaign refreshes it when a send starts. Runs at
 * the top of every cron invocation (hourly).
 */
export async function recoverStuckCampaigns(
  maxAgeMs: number = STUCK_SENDING_MAX_AGE_MS,
): Promise<string[]> {
  const now = new Date().toISOString();
  const cutoff = new Date(Date.now() - maxAgeMs).toISOString();

  const { data, error } = await supabase
    .from("email_campaigns")
    .update({ status: "failed", updated_at: now })
    .eq("status", "sending")
    .lt("updated_at", cutoff)
    .select("id");

  if (error) {
    console.error("[campaigns] Failed to recover stuck campaigns:", error);
    return [];
  }

  const ids = (data ?? []).map((row: { id: string }) => row.id);
  for (const campaignId of ids) {
    console.error(`[campaigns] Recovered stuck campaign ${campaignId} (sending > 2h) — marked failed`);
    try {
      await createCampaignLog({
        campaignId,
        totalSent: 0,
        totalFailed: 0,
        startedAt: cutoff,
        finishedAt: now,
        errorDetails:
          "Campaign was stuck in 'sending' for over 2 hours and was marked failed by the recovery job. Some emails may have been delivered before the interruption.",
      });
    } catch (logError) {
      console.error(`[campaigns] Failed to log recovery for ${campaignId}:`, logError);
    }
  }
  return ids;
}

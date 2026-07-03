import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { supabase } from "~/lib/supabase.server";
import {
  sendCampaign,
  recoverStuckCampaigns,
  type SendCampaignResult,
} from "~/lib/campaigns.server";
import { sendAbandonedCartReminders } from "~/lib/abandoned-carts.server";

export const config = {
  maxDuration: 60,
};

// Runs on the Vercel cron (hourly). Safe to fire concurrently or more often:
// each campaign is claimed atomically (scheduled → sending) before sending,
// so a second invocation simply skips campaigns already taken.
export async function loader({ request }: LoaderFunctionArgs) {
  // Verify the request comes from Vercel Cron
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  // Recover campaigns stuck in "sending" (crashed run) before processing.
  const recovered = await recoverStuckCampaigns();

  // Find campaigns that are scheduled and due to send. Drafts are excluded by
  // the status filter; rows without a scheduled_at never match the lte filter.
  const now = new Date().toISOString();
  const { data: dueCampaigns, error: queryError } = await supabase
    .from("email_campaigns")
    .select("id")
    .eq("status", "scheduled")
    .lte("scheduled_at", now);

  if (queryError) {
    console.error("[cron] Failed to query scheduled campaigns:", queryError);
    return json({ error: "Failed to query campaigns" }, { status: 500 });
  }

  const results: SendCampaignResult[] = [];
  for (const { id: campaignId } of dueCampaigns ?? []) {
    const result = await sendCampaign(campaignId, { claimFrom: ["scheduled"] });
    if (!result.claimed) {
      // Another invocation claimed it between the query and the claim — skip.
      console.log(`[cron] Skipping campaign ${campaignId}: ${result.error}`);
    }
    results.push(result);
  }

  // Abandoned-cart reminders piggyback on the same hourly cron (no extra
  // infra). Runs after campaign processing; fails soft internally, so a
  // broken reminders pass can never fail the campaign run. Each cart is
  // claimed with a compare-and-set before sending, so overlapping cron
  // invocations can't double-send.
  const abandonedCarts = await sendAbandonedCartReminders();

  if ((!dueCampaigns || dueCampaigns.length === 0) && recovered.length === 0) {
    return json({
      success: true,
      processed: 0,
      recovered: 0,
      abandonedCarts,
      message: "No campaigns due",
    });
  }

  return json({
    success: true,
    processed: results.length,
    recovered: recovered.length,
    recoveredIds: recovered,
    results,
    abandonedCarts,
  });
}

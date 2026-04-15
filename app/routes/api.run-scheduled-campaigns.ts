import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { render } from "@react-email/render";
import { getResend } from "~/lib/resend.server";
import {
  getCampaign,
  getCampaignContent,
  updateCampaign,
  createCampaignLog,
  getActiveSubscribers,
  getSubscribersByTags,
} from "~/data/queries.server";
import { supabase } from "~/lib/supabase.server";
import NewCollectionEmail from "~/emails/new-collection";
import FlashSaleEmail from "~/emails/flash-sale";
import ProductLaunchEmail from "~/emails/product-launch";

const templateMap: Record<string, React.FC<any>> = {
  "new-collection": NewCollectionEmail,
  "flash-sale": FlashSaleEmail,
  "product-launch": ProductLaunchEmail,
};

const BATCH_SIZE = 50;

export async function loader({ request }: LoaderFunctionArgs) {
  // Verify the request comes from Vercel Cron
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find campaigns that are scheduled and due to send
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

  if (!dueCampaigns || dueCampaigns.length === 0) {
    return json({ success: true, processed: 0, message: "No campaigns due" });
  }

  const results: Array<{
    campaignId: string;
    status: "sent" | "failed";
    totalSent?: number;
    totalFailed?: number;
    error?: string;
  }> = [];

  for (const { id: campaignId } of dueCampaigns) {
    const startedAt = new Date().toISOString();

    try {
      // Load the full campaign with template info
      const campaign = await getCampaign(campaignId);
      if (!campaign) {
        results.push({ campaignId, status: "failed", error: "Campaign not found" });
        continue;
      }

      // Update status to sending to prevent double-send
      await updateCampaign(campaignId, { status: "sending" });

      // Load campaign content (saved template variables)
      const content = await getCampaignContent(campaignId);
      if (!content?.variables) {
        await updateCampaign(campaignId, { status: "failed" });
        results.push({ campaignId, status: "failed", error: "No campaign content" });
        continue;
      }

      // Resolve the template component
      const componentName = campaign.email_templates?.component_name;
      if (!componentName || !templateMap[componentName]) {
        await updateCampaign(campaignId, { status: "failed" });
        results.push({
          campaignId,
          status: "failed",
          error: `Unknown template: ${componentName}`,
        });
        continue;
      }

      // Get subscribers (filtered by tags if applicable)
      const targetTags: string[] = campaign.target_tags || [];
      const subscribers =
        targetTags.length > 0
          ? await getSubscribersByTags(targetTags)
          : await getActiveSubscribers();

      if (subscribers.length === 0) {
        await updateCampaign(campaignId, { status: "failed" });
        results.push({ campaignId, status: "failed", error: "No matching subscribers" });
        continue;
      }

      // Render the email template
      const Component = templateMap[componentName];
      const renderedHtml = await render(Component(content.variables));

      // Send in batches via Resend
      const resend = getResend();
      let totalSent = 0;
      let totalFailed = 0;

      for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
        const batch = subscribers.slice(i, i + BATCH_SIZE).map((sub) => ({
          from: process.env.RESEND_FROM_EMAIL || "Flow Urban Wear <onboarding@resend.dev>",
          to: sub.email,
          subject: campaign.subject,
          html: renderedHtml,
        }));

        try {
          await resend.batch.send(batch);
          totalSent += batch.length;
        } catch (batchError) {
          console.error(`[cron] Batch error for campaign ${campaignId} at offset ${i}:`, batchError);
          totalFailed += batch.length;
        }
      }

      const finishedAt = new Date().toISOString();

      // Create campaign log
      await createCampaignLog({
        campaignId,
        totalSent,
        totalFailed,
        startedAt,
        finishedAt,
      });

      // Update campaign status to sent
      await updateCampaign(campaignId, {
        status: "sent",
        sentAt: finishedAt,
      });

      results.push({ campaignId, status: "sent", totalSent, totalFailed });
    } catch (error) {
      console.error(`[cron] Error processing campaign ${campaignId}:`, error);

      const finishedAt = new Date().toISOString();

      try {
        await updateCampaign(campaignId, { status: "failed" });
        await createCampaignLog({
          campaignId,
          totalSent: 0,
          totalFailed: 0,
          startedAt,
          finishedAt,
          errorDetails: error instanceof Error ? error.message : String(error),
        });
      } catch (logError) {
        console.error(`[cron] Failed to log error for campaign ${campaignId}:`, logError);
      }

      results.push({
        campaignId,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return json({
    success: true,
    processed: dueCampaigns.length,
    results,
  });
}

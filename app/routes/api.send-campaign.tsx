import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { render } from "@react-email/render";
import { requireAdmin } from "~/lib/session.server";
import { getResend } from "~/lib/resend.server";
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

const templateMap: Record<string, React.FC<any>> = {
  "new-collection": NewCollectionEmail,
  "flash-sale": FlashSaleEmail,
  "product-launch": ProductLaunchEmail,
};

const BATCH_SIZE = 50;

export async function action({ request }: ActionFunctionArgs) {
  await requireAdmin(request);

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const { campaignId } = await request.json();
  if (!campaignId) {
    return json({ error: "campaignId is required" }, { status: 400 });
  }

  const startedAt = new Date().toISOString();

  try {
    // Load campaign
    const campaign = await getCampaign(campaignId);
    if (!campaign) {
      return json({ error: "Campaign not found" }, { status: 404 });
    }

    // Validate status
    if (campaign.status !== "draft" && campaign.status !== "scheduled") {
      return json(
        { error: `Campaign cannot be sent — current status is "${campaign.status}"` },
        { status: 400 },
      );
    }

    // Load content (saved template variables)
    const content = await getCampaignContent(campaignId);
    if (!content?.variables) {
      return json({ error: "Campaign has no content. Edit the campaign first." }, { status: 400 });
    }

    // Resolve the template component
    const componentName = campaign.email_templates?.component_name;
    if (!componentName || !templateMap[componentName]) {
      return json({ error: `Unknown or missing template: ${componentName}` }, { status: 400 });
    }

    // Get subscribers
    const targetTags: string[] = campaign.target_tags || [];
    const subscribers =
      targetTags.length > 0
        ? await getSubscribersByTags(targetTags)
        : await getActiveSubscribers();

    if (subscribers.length === 0) {
      return json({ error: "No subscribers match the campaign target" }, { status: 400 });
    }

    // Update status to sending
    await updateCampaign(campaignId, { status: "sending" });

    // Render the email template
    const Component = templateMap[componentName];
    const renderedHtml = await render(<Component {...content.variables} />);

    // Send in batches
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
        console.error(`[send-campaign] Batch error at offset ${i}:`, batchError);
        totalFailed += batch.length;
      }
    }

    const finishedAt = new Date().toISOString();

    // Log results
    await createCampaignLog({
      campaignId,
      totalSent,
      totalFailed,
      startedAt,
      finishedAt,
    });

    // Mark campaign as sent
    await updateCampaign(campaignId, {
      status: "sent",
      sentAt: finishedAt,
    });

    return json({
      success: true,
      totalSent,
      totalFailed,
      subscriberCount: subscribers.length,
    });
  } catch (error) {
    console.error("[send-campaign] Error:", error);

    const finishedAt = new Date().toISOString();

    // Attempt to mark as failed and log the error
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
      console.error("[send-campaign] Failed to log error:", logError);
    }

    return json(
      { error: error instanceof Error ? error.message : "Failed to send campaign" },
      { status: 500 },
    );
  }
}

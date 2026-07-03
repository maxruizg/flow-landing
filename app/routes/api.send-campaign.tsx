import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { requireAdmin } from "~/lib/session.server";
import { sendCampaign } from "~/lib/campaigns.server";

export const config = {
  maxDuration: 60,
};

export async function action({ request }: ActionFunctionArgs) {
  await requireAdmin(request);

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const { campaignId } = await request.json();
  if (!campaignId) {
    return json({ error: "campaignId is required" }, { status: 400 });
  }

  // Shared send engine: atomic claim + Resend { data, error } inspection +
  // campaign log + honest final status. Explicit manual sends may target
  // drafts, scheduled campaigns, or retry failed ones.
  const result = await sendCampaign(campaignId, {
    claimFrom: ["draft", "scheduled", "failed"],
  });

  if (!result.claimed) {
    return json(
      { error: result.error ?? "Campaign cannot be sent right now" },
      { status: 409 },
    );
  }

  if (result.status === "failed") {
    return json(
      {
        error: result.error ?? "Campaign failed to send",
        totalSent: result.totalSent ?? 0,
        totalFailed: result.totalFailed ?? 0,
      },
      { status: 500 },
    );
  }

  return json({
    success: true,
    totalSent: result.totalSent ?? 0,
    totalFailed: result.totalFailed ?? 0,
  });
}

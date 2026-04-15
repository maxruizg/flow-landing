import { json } from "@remix-run/node";
import type {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { useLoaderData, Link, useFetcher } from "@remix-run/react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { cn } from "~/lib/utils";
import { requireAdmin } from "~/lib/session.server";
import {
  getCampaigns,
  getCampaignStats,
  deleteCampaign,
  getCampaign,
  getCampaignContent,
  createCampaign,
  upsertCampaignContent,
} from "~/data/queries.server";

export const meta: MetaFunction = () => [
  { title: "FLOW Admin — Campaigns" },
];

// ─── Types ──────────────────────────────────────────────────────

type CampaignStatus = "draft" | "scheduled" | "sending" | "sent" | "failed";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: CampaignStatus;
  template_id: string;
  scheduled_at: string | null;
  created_at: string;
  email_templates: { name: string; component_name: string } | null;
}

interface CampaignStats {
  totalSent: number;
  pending: number;
  total: number;
}

// ─── Status helpers ─────────────────────────────────────────────

const statusStyles: Record<CampaignStatus, string> = {
  draft: "bg-flow-500/10 text-flow-400 border-flow-500/20",
  scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  sending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  sent: "bg-green-500/10 text-green-400 border-green-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
};

const statusTabs = [
  "all",
  "draft",
  "scheduled",
  "sent",
  "failed",
] as const;

function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize",
        statusStyles[status] ?? statusStyles.draft
      )}
    >
      {status}
    </span>
  );
}

// ─── Loader ─────────────────────────────────────────────────────

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  const [campaigns, stats] = await Promise.all([
    getCampaigns(),
    getCampaignStats(),
  ]);
  return json({ campaigns, stats });
}

// ─── Action ─────────────────────────────────────────────────────

export async function action({ request }: ActionFunctionArgs) {
  await requireAdmin(request);
  const form = await request.formData();
  const intent = form.get("intent") as string;

  if (intent === "delete") {
    const id = form.get("id") as string;
    if (!id) return json({ error: "Missing campaign id" }, { status: 400 });
    await deleteCampaign(id);
    return json({ ok: true });
  }

  if (intent === "duplicate") {
    const id = form.get("id") as string;
    if (!id) return json({ error: "Missing campaign id" }, { status: 400 });

    const original = await getCampaign(id);
    if (!original) return json({ error: "Campaign not found" }, { status: 404 });

    const content = await getCampaignContent(id);

    const newId = await createCampaign({
      name: `${original.name} (Copy)`,
      subject: original.subject,
      preheader: original.preheader,
      templateId: original.template_id,
      status: "draft",
      targetTags: original.target_tags,
    });

    if (content?.variables) {
      await upsertCampaignContent(newId, content.variables);
    }

    return json({ ok: true, newId });
  }

  return json({ error: "Unknown intent" }, { status: 400 });
}

// ─── Component ──────────────────────────────────────────────────

export default function AdminCampaigns() {
  const { campaigns, stats } = useLoaderData<typeof loader>() as {
    campaigns: Campaign[];
    stats: CampaignStats;
  };
  const fetcher = useFetcher();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (activeTab === "all") return campaigns;
    return campaigns.filter((c) => c.status === activeTab);
  }, [campaigns, activeTab]);

  function handleDelete(id: string) {
    fetcher.submit({ intent: "delete", id }, { method: "post" });
    setConfirmDeleteId(null);
  }

  function handleDuplicate(id: string) {
    fetcher.submit({ intent: "duplicate", id }, { method: "post" });
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-5">
          <p className="text-xs text-flow-500 uppercase tracking-wide mb-1">
            Total Sent
          </p>
          <p className="text-2xl font-display font-bold text-white">
            {stats.totalSent.toLocaleString()}
          </p>
        </div>
        <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-5">
          <p className="text-xs text-flow-500 uppercase tracking-wide mb-1">
            Scheduled / Pending
          </p>
          <p className="text-2xl font-display font-bold text-white">
            {stats.pending}
          </p>
        </div>
        <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-5">
          <p className="text-xs text-flow-500 uppercase tracking-wide mb-1">
            Total Campaigns
          </p>
          <p className="text-2xl font-display font-bold text-white">
            {stats.total}
          </p>
        </div>
      </div>

      {/* Tabs + New Campaign */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-medium uppercase tracking-wide whitespace-nowrap transition-colors",
                activeTab === tab
                  ? "bg-flow-800 text-white"
                  : "text-flow-400 hover:text-white hover:bg-flow-800/50"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <Link
          to="/admin/campaigns/new"
          className="bg-white text-flow-black font-display font-semibold text-sm tracking-wide uppercase rounded-lg px-5 py-2.5 hover:bg-flow-200 transition-colors text-center"
        >
          + New Campaign
        </Link>
      </div>

      {/* Campaign list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-flow-500 mb-4">
            <svg
              className="w-10 h-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-flow-400 text-sm">
            No campaigns{activeTab !== "all" ? ` with status "${activeTab}"` : ""} yet.
          </p>
        </div>
      ) : (
        <div className="bg-flow-900 border border-flow-800/50 rounded-xl overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-flow-800/30">
                  <th className="text-left text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">
                    Name
                  </th>
                  <th className="text-left text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">
                    Template
                  </th>
                  <th className="text-left text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">
                    Status
                  </th>
                  <th className="text-left text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">
                    Created
                  </th>
                  <th className="text-right text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="border-b border-flow-800/30 last:border-0 hover:bg-flow-800/50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <p className="text-sm text-white font-medium">
                        {campaign.name}
                      </p>
                      {campaign.subject && (
                        <p className="text-xs text-flow-500 mt-0.5 truncate max-w-xs">
                          {campaign.subject}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm text-flow-300">
                      {campaign.email_templates?.name || "—"}
                    </td>
                    <td className="px-5 py-3">
                      <CampaignStatusBadge
                        status={campaign.status as CampaignStatus}
                      />
                    </td>
                    <td className="px-5 py-3 text-sm text-flow-400">
                      {formatDate(campaign.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit */}
                        <Link
                          to={`/admin/campaigns/${campaign.id}`}
                          className="p-2 rounded-lg text-flow-400 hover:text-white hover:bg-flow-800 transition-colors"
                          title="Edit"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </Link>
                        {/* Duplicate */}
                        <button
                          onClick={() => handleDuplicate(campaign.id)}
                          className="p-2 rounded-lg text-flow-400 hover:text-white hover:bg-flow-800 transition-colors"
                          title="Duplicate"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </button>
                        {/* Delete */}
                        {confirmDeleteId === campaign.id ? (
                          <div className="flex items-center gap-1 ml-1">
                            <button
                              onClick={() => handleDelete(campaign.id)}
                              className="px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 rounded text-xs font-medium text-flow-400 hover:text-white transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(campaign.id)}
                            className="p-2 rounded-lg text-flow-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-flow-800/30">
            {filtered.map((campaign) => (
              <div
                key={campaign.id}
                className="p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {campaign.name}
                    </p>
                    {campaign.subject && (
                      <p className="text-xs text-flow-500 mt-0.5 truncate">
                        {campaign.subject}
                      </p>
                    )}
                  </div>
                  <CampaignStatusBadge
                    status={campaign.status as CampaignStatus}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-flow-500">
                  <span>{campaign.email_templates?.name || "No template"}</span>
                  <span>{formatDate(campaign.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Link
                    to={`/admin/campaigns/${campaign.id}`}
                    className="flex-1 text-center px-3 py-1.5 rounded-lg text-xs font-medium text-flow-300 bg-flow-800 hover:text-white transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDuplicate(campaign.id)}
                    className="flex-1 text-center px-3 py-1.5 rounded-lg text-xs font-medium text-flow-300 bg-flow-800 hover:text-white transition-colors"
                  >
                    Duplicate
                  </button>
                  {confirmDeleteId === campaign.id ? (
                    <>
                      <button
                        onClick={() => handleDelete(campaign.id)}
                        className="flex-1 text-center px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-flow-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(campaign.id)}
                      className="flex-1 text-center px-3 py-1.5 rounded-lg text-xs font-medium text-red-400/70 bg-flow-800 hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

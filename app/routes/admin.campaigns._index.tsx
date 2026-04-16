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
  getSubscriberCount,
} from "~/data/queries.server";

export const meta: MetaFunction = () => [{ title: "FLOW Admin — Emails" }];

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

const statusStyles: Record<CampaignStatus, string> = {
  draft: "bg-flow-500/10 text-flow-400 border-flow-500/20",
  scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  sending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  sent: "bg-green-500/10 text-green-400 border-green-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
};

function StatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize",
        statusStyles[status] ?? statusStyles.draft,
      )}
    >
      {status}
    </span>
  );
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  const [campaigns, stats, subscriberCount] = await Promise.all([
    getCampaigns(),
    getCampaignStats(),
    getSubscriberCount(),
  ]);
  return json({ campaigns, stats, subscriberCount });
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAdmin(request);
  const form = await request.formData();
  const intent = form.get("intent") as string;

  if (intent === "delete") {
    const id = form.get("id") as string;
    if (!id) return json({ error: "Missing id" }, { status: 400 });
    await deleteCampaign(id);
    return json({ ok: true });
  }

  if (intent === "duplicate") {
    const id = form.get("id") as string;
    if (!id) return json({ error: "Missing id" }, { status: 400 });
    const original = await getCampaign(id);
    if (!original) return json({ error: "Not found" }, { status: 404 });
    const content = await getCampaignContent(id);
    const newId = await createCampaign({
      name: `${original.name} (Copy)`,
      subject: original.subject,
      preheader: original.preheader,
      templateId: original.template_id,
      status: "draft",
      targetTags: original.target_tags,
    });
    if (content?.variables) await upsertCampaignContent(newId, content.variables);
    return json({ ok: true, newId });
  }

  return json({ error: "Unknown intent" }, { status: 400 });
}

const emailTypes = [
  {
    title: "Newsletter",
    description: "Quick email blast to all active subscribers. Write a subject and body, hit send.",
    href: "/admin/newsletter",
    color: "from-blue-500/20 to-blue-600/5 border-blue-500/20",
    iconColor: "text-blue-400",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    action: "Compose",
  },
  {
    title: "Marketing Campaign",
    description: "Template-based campaigns with scheduling, previews, and send tracking.",
    href: "/admin/campaigns/new",
    color: "from-purple-500/20 to-purple-600/5 border-purple-500/20",
    iconColor: "text-purple-400",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
    action: "Create",
  },
  {
    title: "Order Confirmation",
    description: "Automatic email sent to customers after a successful purchase.",
    href: "/admin/order-confirmation",
    color: "from-green-500/20 to-green-600/5 border-green-500/20",
    iconColor: "text-green-400",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    action: "Configure",
  },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminEmails() {
  const { campaigns, stats, subscriberCount } = useLoaderData<typeof loader>() as {
    campaigns: Campaign[];
    stats: CampaignStats;
    subscriberCount: number;
  };
  const fetcher = useFetcher();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (activeTab === "all") return campaigns;
    return campaigns.filter((c) => c.status === activeTab);
  }, [campaigns, activeTab]);

  const tabs = ["all", "draft", "scheduled", "sent", "failed"] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Email Type Cards */}
      <div>
        <h2 className="text-xs text-flow-500 uppercase tracking-[0.2em] mb-4">
          Send an Email
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {emailTypes.map((type) => (
            <div
              key={type.title}
              className={cn(
                "relative bg-gradient-to-br border rounded-xl p-5 transition-all",
                type.color,
                type.href && "hover:border-white/20 hover:scale-[1.01]",
              )}
            >
              <div className={cn("mb-3", type.iconColor)}>{type.icon}</div>
              <h3 className="text-sm font-display font-semibold text-white mb-1">
                {type.title}
              </h3>
              <p className="text-xs text-flow-400 leading-relaxed mb-4">
                {type.description}
              </p>
              <Link
                to={type.href}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg px-3 py-1.5 transition-colors"
              >
                {type.action}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-4">
          <p className="text-[10px] text-flow-500 uppercase tracking-wider mb-1">Subscribers</p>
          <p className="text-xl font-display font-bold text-white">{subscriberCount.toLocaleString()}</p>
        </div>
        <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-4">
          <p className="text-[10px] text-flow-500 uppercase tracking-wider mb-1">Emails Sent</p>
          <p className="text-xl font-display font-bold text-white">{stats.totalSent.toLocaleString()}</p>
        </div>
        <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-4">
          <p className="text-[10px] text-flow-500 uppercase tracking-wider mb-1">Scheduled</p>
          <p className="text-xl font-display font-bold text-white">{stats.pending}</p>
        </div>
        <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-4">
          <p className="text-[10px] text-flow-500 uppercase tracking-wider mb-1">Campaigns</p>
          <p className="text-xl font-display font-bold text-white">{stats.total}</p>
        </div>
      </div>

      {/* Campaign List */}
      <div>
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between mb-4">
          <h2 className="text-xs text-flow-500 uppercase tracking-[0.2em]">
            Campaign History
          </h2>
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wide whitespace-nowrap transition-colors",
                  activeTab === tab
                    ? "bg-flow-800 text-white"
                    : "text-flow-500 hover:text-white hover:bg-flow-800/50",
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-flow-900 border border-flow-800/50 rounded-xl">
            <svg className="w-8 h-8 text-flow-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-flow-500 text-sm">
              No campaigns{activeTab !== "all" ? ` with status "${activeTab}"` : ""} yet.
            </p>
          </div>
        ) : (
          <div className="bg-flow-900 border border-flow-800/50 rounded-xl overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-flow-800/30">
                    <th className="text-left text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">Name</th>
                    <th className="text-left text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">Template</th>
                    <th className="text-left text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">Status</th>
                    <th className="text-left text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">Created</th>
                    <th className="text-right text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-b border-flow-800/30 last:border-0 hover:bg-flow-800/50 transition-colors">
                      <td className="px-5 py-3">
                        <p className="text-sm text-white font-medium">{c.name}</p>
                        {c.subject && <p className="text-xs text-flow-500 mt-0.5 truncate max-w-xs">{c.subject}</p>}
                      </td>
                      <td className="px-5 py-3 text-sm text-flow-300">{c.email_templates?.name || "—"}</td>
                      <td className="px-5 py-3"><StatusBadge status={c.status as CampaignStatus} /></td>
                      <td className="px-5 py-3 text-sm text-flow-400">{formatDate(c.created_at)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/admin/campaigns/${c.id}`}
                            className="p-2 rounded-lg text-flow-400 hover:text-white hover:bg-flow-800 transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </Link>
                          <button
                            onClick={() => fetcher.submit({ intent: "duplicate", id: c.id }, { method: "post" })}
                            className="p-2 rounded-lg text-flow-400 hover:text-white hover:bg-flow-800 transition-colors"
                            title="Duplicate"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          {confirmDeleteId === c.id ? (
                            <div className="flex items-center gap-1 ml-1">
                              <button
                                onClick={() => {
                                  fetcher.submit({ intent: "delete", id: c.id }, { method: "post" });
                                  setConfirmDeleteId(null);
                                }}
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
                              onClick={() => setConfirmDeleteId(c.id)}
                              className="p-2 rounded-lg text-flow-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

            {/* Mobile */}
            <div className="md:hidden divide-y divide-flow-800/30">
              {filtered.map((c) => (
                <div key={c.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium truncate">{c.name}</p>
                      {c.subject && <p className="text-xs text-flow-500 mt-0.5 truncate">{c.subject}</p>}
                    </div>
                    <StatusBadge status={c.status as CampaignStatus} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-flow-500">
                    <span>{c.email_templates?.name || "No template"}</span>
                    <span>{formatDate(c.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      to={`/admin/campaigns/${c.id}`}
                      className="flex-1 text-center px-3 py-1.5 rounded-lg text-xs font-medium text-flow-300 bg-flow-800 hover:text-white transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => fetcher.submit({ intent: "duplicate", id: c.id }, { method: "post" })}
                      className="flex-1 text-center px-3 py-1.5 rounded-lg text-xs font-medium text-flow-300 bg-flow-800 hover:text-white transition-colors"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() =>
                        confirmDeleteId === c.id
                          ? (() => {
                              fetcher.submit({ intent: "delete", id: c.id }, { method: "post" });
                              setConfirmDeleteId(null);
                            })()
                          : setConfirmDeleteId(c.id)
                      }
                      className={cn(
                        "flex-1 text-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                        confirmDeleteId === c.id
                          ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          : "text-red-400/70 bg-flow-800 hover:text-red-400",
                      )}
                    >
                      {confirmDeleteId === c.id ? "Confirm" : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

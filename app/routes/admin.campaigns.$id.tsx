import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { requireAdmin } from "~/lib/session.server";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  getCampaign,
  getCampaignContent,
  getCampaignLog,
} from "~/data/queries.server";

export const meta: MetaFunction = () => [{ title: "FLOW Admin — Campaign Detail" }];

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireAdmin(request);
  const campaign = await getCampaign(params.id!);
  if (!campaign) {
    throw new Response("Campaign not found", { status: 404 });
  }
  const content = await getCampaignContent(params.id!);
  const log = await getCampaignLog(params.id!);
  return json({ campaign, content, log });
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-flow-700 text-flow-300",
    scheduled: "bg-blue-900/60 text-blue-300",
    sending: "bg-yellow-900/60 text-yellow-300",
    sent: "bg-green-900/60 text-green-300",
    completed: "bg-green-900/60 text-green-300",
    failed: "bg-red-900/60 text-red-300",
  };
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${
        colors[status] || "bg-flow-700 text-flow-300"
      }`}
    >
      {status}
    </span>
  );
}

function formatDuration(startedAt: string, finishedAt: string) {
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 1000) return `${ms}ms`;
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remainSecs = secs % 60;
  return `${mins}m ${remainSecs}s`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CampaignDetail() {
  const { campaign, content, log } = useLoaderData<typeof loader>();
  const [showPreview, setShowPreview] = useState(false);

  const previewUrl = content?.variables
    ? `/api/email-preview?${new URLSearchParams({
        template: campaign.email_templates?.component_name || "",
        variables: JSON.stringify(content.variables),
      }).toString()}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Back link */}
      <Link
        to="/admin/campaigns"
        className="inline-flex items-center gap-2 text-sm text-flow-400 hover:text-white transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Campaigns
      </Link>

      {/* Heading */}
      <div className="flex items-center gap-4 flex-wrap">
        <h1 className="text-2xl font-display font-bold text-white">{campaign.name}</h1>
        <StatusBadge status={campaign.status} />
      </div>

      {/* Stats cards */}
      {log && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-5">
            <p className="text-xs text-flow-400 uppercase tracking-wide mb-1">Total Sent</p>
            <p className="text-2xl font-bold text-green-400">{log.total_sent.toLocaleString()}</p>
          </div>
          <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-5">
            <p className="text-xs text-flow-400 uppercase tracking-wide mb-1">Total Failed</p>
            <p className="text-2xl font-bold text-red-400">{log.total_failed.toLocaleString()}</p>
          </div>
          <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-5">
            <p className="text-xs text-flow-400 uppercase tracking-wide mb-1">Duration</p>
            <p className="text-2xl font-bold text-white">
              {log.started_at && log.finished_at
                ? formatDuration(log.started_at, log.finished_at)
                : "—"}
            </p>
          </div>
        </div>
      )}

      {/* Info section */}
      <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-flow-300 uppercase tracking-wide">Campaign Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-flow-500 mb-1">Subject</p>
            <p className="text-white">{campaign.subject || "—"}</p>
          </div>
          <div>
            <p className="text-flow-500 mb-1">Template</p>
            <p className="text-white">{campaign.email_templates?.name || "—"}</p>
          </div>
          <div>
            <p className="text-flow-500 mb-1">Sent at</p>
            <p className="text-white">{campaign.sent_at ? formatDate(campaign.sent_at) : "—"}</p>
          </div>
          <div>
            <p className="text-flow-500 mb-1">Target Audience</p>
            <p className="text-white">
              {campaign.target_tags && campaign.target_tags.length > 0
                ? campaign.target_tags.join(", ")
                : "All subscribers"}
            </p>
          </div>
        </div>

        {/* View Email button */}
        {previewUrl && (
          <button
            onClick={() => setShowPreview(true)}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-flow-800 text-white text-sm font-medium hover:bg-flow-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Email
          </button>
        )}
      </div>

      {/* Error details (only for failed campaigns) */}
      {log?.error_details && (
        <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-6 space-y-2">
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wide">Error Details</h2>
          <pre className="text-sm text-red-300 whitespace-pre-wrap font-mono leading-relaxed">
            {log.error_details}
          </pre>
        </div>
      )}

      {/* Full-screen email preview overlay */}
      {showPreview && previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 bg-flow-900 border-b border-flow-800/50">
            <h3 className="text-white text-sm font-semibold">Email Preview</h3>
            <button
              onClick={() => setShowPreview(false)}
              className="text-flow-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-auto bg-white">
            <iframe
              src={previewUrl}
              title="Email Preview"
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

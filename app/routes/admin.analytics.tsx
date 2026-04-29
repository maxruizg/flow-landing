import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { motion } from "framer-motion";
import { requireAdmin } from "~/lib/session.server";
import { getVisitorAnalytics } from "~/data/queries.server";
import { StatCard } from "~/components/admin/StatCard";
import { VisitorsChart } from "~/components/admin/VisitorsChart";

export const meta: MetaFunction = () => [{ title: "FLOW Admin — Analytics" }];

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  const analytics = await getVisitorAnalytics();
  return json({ analytics });
}

const eyeIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

export default function AdminAnalytics() {
  const { analytics } = useLoaderData<typeof loader>();

  const stats = [
    {
      label: "Today",
      value: analytics.today.uniques.toLocaleString(),
      sub: `${analytics.today.views.toLocaleString()} views`,
      change: analytics.today.uniquesChange,
    },
    {
      label: "This Week (7d)",
      value: analytics.week.uniques.toLocaleString(),
      sub: `${analytics.week.views.toLocaleString()} views`,
      change: analytics.week.uniquesChange,
    },
    {
      label: "This Month (30d)",
      value: analytics.month.uniques.toLocaleString(),
      sub: `${analytics.month.views.toLocaleString()} views`,
      change: analytics.month.uniquesChange,
    },
    {
      label: "All Time",
      value: analytics.allTime.uniques.toLocaleString(),
      sub: `${analytics.allTime.views.toLocaleString()} views`,
      change: 0,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={s.label} className="relative">
            <StatCard
              icon={eyeIcon}
              label={s.label}
              value={s.value}
              change={s.change}
              index={i}
            />
            <span className="absolute bottom-5 right-5 text-[11px] text-flow-500">
              {s.sub}
            </span>
          </div>
        ))}
      </div>

      <VisitorsChart data={analytics.daily} />

      <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-display font-semibold text-white mb-1">
              Want deeper breakdowns?
            </h3>
            <p className="text-xs text-flow-400 leading-relaxed max-w-md">
              Per-page, country, device and referrer stats are tracked
              automatically by Vercel Web Analytics. Open the Vercel dashboard
              for richer drill-downs that complement these first-party numbers.
            </p>
          </div>
          <a
            href="https://vercel.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 bg-white text-flow-black font-display font-semibold text-xs tracking-wide uppercase rounded-lg px-4 py-2.5 hover:bg-flow-200 transition-colors"
          >
            Open Vercel
          </a>
        </div>
      </div>
    </motion.div>
  );
}

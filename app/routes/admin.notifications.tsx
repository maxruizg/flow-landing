import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
import type { MetaFunction, ActionFunctionArgs } from "@remix-run/node";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { cn } from "~/lib/utils";
import { getAdminNotifications, markNotificationRead, markAllNotificationsRead } from "~/data/queries.server";
import { AdminEmptyState } from "~/components/admin/AdminEmptyState";
import type { AdminNotification } from "~/lib/types";

export const meta: MetaFunction = () => [{ title: "FLOW Admin — Notifications" }];

export async function loader() {
  const adminNotifications = await getAdminNotifications();
  return json({ adminNotifications });
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "markRead") {
    const id = form.get("id") as string;
    await markNotificationRead(id);
  } else if (intent === "markAllRead") {
    await markAllNotificationsRead();
  }

  return redirect("/admin/notifications");
}

const filterTabs = ["all", "unread", "order", "stock", "customer", "system"] as const;

const typeConfig: Record<AdminNotification["type"], { color: string; icon: JSX.Element }> = {
  order: {
    color: "bg-blue-500/15 text-blue-400",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  stock: {
    color: "bg-yellow-500/15 text-yellow-400",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  customer: {
    color: "bg-green-500/15 text-green-400",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  system: {
    color: "bg-flow-400/15 text-flow-400",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AdminNotifications() {
  const { adminNotifications } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const filtered = useMemo(() => {
    return adminNotifications.filter((n) => {
      const matchTab =
        activeTab === "all" ||
        (activeTab === "unread" ? !n.read : n.type === activeTab);
      const q = search.toLowerCase();
      const matchSearch =
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [adminNotifications, activeTab, search]);

  const unreadCount = adminNotifications.filter((n) => !n.read).length;

  function markAllRead() {
    fetcher.submit({ intent: "markAllRead" }, { method: "post" });
  }

  function handleClick(n: AdminNotification) {
    if (!n.read) {
      fetcher.submit({ intent: "markRead", id: n.id }, { method: "post" });
    }
    if (n.linkTo) navigate(n.linkTo);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto">
          {filterTabs.map((tab) => (
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
              <span className="flex items-center gap-1.5">
                {tab}
                {tab === "unread" && unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] leading-none bg-accent-500 text-white rounded-full">
                    {unreadCount}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search notifications..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-flow-950 border border-flow-700 rounded-lg px-4 py-2.5 text-sm text-flow-100 placeholder:text-flow-500 focus:border-accent-500 focus:outline-none transition-colors sm:max-w-xs"
        />
      </div>

      {/* Bulk actions */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-flow-500">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </span>
          <button
            onClick={markAllRead}
            className="text-xs text-accent-400 hover:text-accent-300 transition-colors"
          >
            Mark All as Read
          </button>
        </div>
      )}

      {/* Notification cards */}
      {filtered.length === 0 ? (
        <AdminEmptyState
          icon={
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
          message="No notifications match your filters."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const config = typeConfig[n.type];
            return (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn(
                  "bg-flow-900 border border-flow-800/50 rounded-xl p-4 flex items-start gap-4 transition-colors",
                  n.linkTo && "cursor-pointer hover:bg-flow-800/50",
                  !n.read && "border-l-2 border-l-accent-500 bg-flow-900/80"
                )}
              >
                {/* Type icon */}
                <div className={cn("flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center", config.color)}>
                  {config.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", n.read ? "text-flow-300" : "text-white")}>
                    {n.title}
                  </p>
                  <p className="text-xs text-flow-500 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[11px] text-flow-600 mt-1.5">{formatDate(n.date)}</p>
                </div>

                {/* Read indicator */}
                {!n.read && (
                  <div className="flex-shrink-0 mt-1.5">
                    <span className="w-2 h-2 bg-accent-500 rounded-full block" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

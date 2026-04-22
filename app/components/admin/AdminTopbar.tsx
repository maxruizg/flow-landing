import { Link, Form } from "@remix-run/react";
import { AdminBreadcrumb } from "./AdminBreadcrumb";

interface AdminTopbarProps {
  title: string;
  onMenuToggle: () => void;
  adminName?: string;
  unreadNotifications?: number;
}

export function AdminTopbar({ title, onMenuToggle, adminName, unreadNotifications = 0 }: AdminTopbarProps) {
  const initials = adminName
    ? adminName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "A";

  return (
    <header className="h-16 bg-flow-black border-b border-flow-800/50 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden text-flow-400 hover:text-white transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <AdminBreadcrumb />
      </div>

      <div className="flex items-center gap-4">
        <Link
          to="/admin/notifications"
          className="relative text-flow-400 hover:text-white transition-colors"
          aria-label={
            unreadNotifications > 0
              ? `Notifications (${unreadNotifications} unread)`
              : "Notifications"
          }
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadNotifications > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 text-[10px] leading-none font-medium flex items-center justify-center bg-accent-500 text-white rounded-full">
              {unreadNotifications > 9 ? "9+" : unreadNotifications}
            </span>
          )}
        </Link>

        {adminName && (
          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-flow-800/50">
            <div className="w-7 h-7 rounded-full bg-flow-800 flex items-center justify-center">
              <span className="text-xs font-medium text-white">{initials}</span>
            </div>
            <span className="text-sm text-flow-300">{adminName}</span>
          </div>
        )}

        <Form method="post" action="/admin/logout">
          <button
            type="submit"
            className="text-flow-400 hover:text-white transition-colors"
            aria-label="Log out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </Form>
      </div>
    </header>
  );
}

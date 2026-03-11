import { Link, useNavigate } from "@remix-run/react";

interface AdminTopbarProps {
  title: string;
  onMenuToggle: () => void;
}

export function AdminTopbar({ title, onMenuToggle }: AdminTopbarProps) {
  const navigate = useNavigate();

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
        <h1 className="font-display text-sm font-semibold tracking-wide text-white uppercase">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <Link
          to="/admin/notifications"
          className="relative text-flow-400 hover:text-white transition-colors"
          aria-label="Notifications"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent-500 rounded-full" />
        </Link>

        <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-flow-800/50">
          <div className="w-7 h-7 rounded-full bg-flow-800 flex items-center justify-center">
            <span className="text-xs font-medium text-white">DF</span>
          </div>
          <span className="text-sm text-flow-300">Dany Flow</span>
        </div>

        <button
          onClick={() => navigate("/admin")}
          className="text-flow-400 hover:text-white transition-colors"
          aria-label="Log out"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
}

import { Link, useLocation } from "@remix-run/react";
import { cn } from "~/lib/utils";

const segmentLabels: Record<string, string> = {
  admin: "Admin",
  dashboard: "Dashboard",
  products: "Products",
  content: "Content",
  orders: "Orders",
  customers: "Customers",
  banners: "Banners",
  campaigns: "Emails",
  subscribers: "Subscribers",
  newsletter: "Newsletter",
  notifications: "Notifications",
  settings: "Settings",
  "order-confirmation": "Order Confirmation",
  new: "New",
};

function formatSegment(segment: string): string {
  if (segmentLabels[segment]) return segmentLabels[segment];
  if (segment.startsWith("p-")) return segment.replace(/^p-/, "").replace(/-/g, " ");
  return segment.replace(/-/g, " ");
}

function ChevronIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-flow-600 shrink-0" fill="none" viewBox="0 0 24 24">
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function AdminBreadcrumb() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  const crumbs = segments.map((segment, i) => {
    const path = "/" + segments.slice(0, i + 1).join("/");
    const label = formatSegment(segment);
    const isLast = i === segments.length - 1;
    const isFirst = i === 0;

    return { path, label, isLast, isFirst };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0">
      {crumbs.map((crumb, i) => (
        <div key={crumb.path} className="flex items-center gap-1.5 min-w-0">
          {i > 0 && <ChevronIcon />}
          {crumb.isLast ? (
            <span
              className={cn(
                "text-sm font-medium text-white truncate",
                crumb.isFirst && "hidden",
              )}
            >
              {crumb.label}
            </span>
          ) : crumb.isFirst ? (
            <Link
              to={crumb.path + "/dashboard"}
              className="text-sm text-flow-500 hover:text-flow-300 transition-colors shrink-0"
            >
              {crumb.label}
            </Link>
          ) : (
            <Link
              to={crumb.path}
              className="text-sm text-flow-500 hover:text-flow-300 transition-colors truncate"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}

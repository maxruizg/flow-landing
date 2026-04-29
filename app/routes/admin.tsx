import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useLocation, useRouteLoaderData } from "@remix-run/react";
import { useState } from "react";
import { AdminSidebar } from "~/components/admin/AdminSidebar";
import { AdminTopbar } from "~/components/admin/AdminTopbar";
import { ToastProvider } from "~/components/admin/ToastProvider";
import { getAdminSession } from "~/lib/session.server";
import { getUnreadNotificationCount } from "~/data/queries.server";
import type { Toast } from "~/lib/toast.server";

const pageTitles: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/products": "Products",
  "/admin/content": "Content",
  "/admin/orders": "Orders",
  "/admin/customers": "Customers",
  "/admin/banners": "Banners",
  "/admin/campaigns": "Emails",
  "/admin/analytics": "Analytics",
  "/admin/subscribers": "Subscribers",
  "/admin/newsletter": "Newsletter",
  "/admin/order-confirmation": "Emails",
  "/admin/notifications": "Notifications",
  "/admin/settings": "Settings",
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { adminId, adminName } = await getAdminSession(request);
  const unreadNotifications = adminId ? await getUnreadNotificationCount() : 0;
  return json({
    adminId: adminId || null,
    adminName: adminName || null,
    unreadNotifications,
  });
}

export default function AdminLayout() {
  const { adminName, unreadNotifications } = useLoaderData<typeof loader>();
  const rootData = useRouteLoaderData("root") as { flashToast?: Toast | null } | undefined;
  const location = useLocation();
  const isLoginPage = location.pathname === "/admin" || location.pathname === "/admin/";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const title = pageTitles[location.pathname]
    ?? (location.pathname.startsWith("/admin/products/") ? "Products"
      : location.pathname.startsWith("/admin/campaigns/") ? "Campaigns"
      : "Admin");

  if (isLoginPage) {
    return (
      <ToastProvider flash={rootData?.flashToast ?? null}>
        <div className="min-h-screen bg-flow-black">
          <Outlet />
        </div>
      </ToastProvider>
    );
  }

  // If not logged in and not on login page, the child route's loader
  // will handle the redirect via requireAdmin()
  return (
    <ToastProvider flash={rootData?.flashToast ?? null}>
      <div className="min-h-screen bg-flow-950">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="lg:pl-64">
          <AdminTopbar
            title={title}
            onMenuToggle={() => setSidebarOpen((o) => !o)}
            adminName={adminName || undefined}
            unreadNotifications={unreadNotifications}
          />
          <main className="p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}

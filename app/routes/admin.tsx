import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useLocation } from "@remix-run/react";
import { useState } from "react";
import { AdminSidebar } from "~/components/admin/AdminSidebar";
import { AdminTopbar } from "~/components/admin/AdminTopbar";
import { getAdminSession } from "~/lib/session.server";

const pageTitles: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/products": "Products",
  "/admin/content": "Content",
  "/admin/orders": "Orders",
  "/admin/customers": "Customers",
  "/admin/banners": "Banners",
  "/admin/campaigns": "Campaigns",
  "/admin/subscribers": "Subscribers",
  "/admin/newsletter": "Newsletter",
  "/admin/notifications": "Notifications",
  "/admin/settings": "Settings",
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { adminId, adminName } = await getAdminSession(request);
  return json({ adminId: adminId || null, adminName: adminName || null });
}

export default function AdminLayout() {
  const { adminId, adminName } = useLoaderData<typeof loader>();
  const location = useLocation();
  const isLoginPage = location.pathname === "/admin" || location.pathname === "/admin/";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const title = pageTitles[location.pathname]
    ?? (location.pathname.startsWith("/admin/products/") ? "Products"
      : location.pathname.startsWith("/admin/campaigns/") ? "Campaigns"
      : "Admin");

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-flow-black">
        <Outlet />
      </div>
    );
  }

  // If not logged in and not on login page, the child route's loader
  // will handle the redirect via requireAdmin()
  return (
    <div className="min-h-screen bg-flow-950">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <AdminTopbar
          title={title}
          onMenuToggle={() => setSidebarOpen((o) => !o)}
          adminName={adminName || undefined}
        />
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

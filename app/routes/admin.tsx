import { Outlet, useLocation } from "@remix-run/react";
import { useState } from "react";
import { AdminSidebar } from "~/components/admin/AdminSidebar";
import { AdminTopbar } from "~/components/admin/AdminTopbar";

const pageTitles: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/products": "Products",
  "/admin/content": "Content",
  "/admin/orders": "Orders",
  "/admin/customers": "Customers",
  "/admin/notifications": "Notifications",
  "/admin/settings": "Settings",
};

export default function AdminLayout() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/admin" || location.pathname === "/admin/";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const title = pageTitles[location.pathname]
    ?? (location.pathname.startsWith("/admin/products/") ? "Products" : "Admin");

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-flow-black">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-flow-950">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <AdminTopbar title={title} onMenuToggle={() => setSidebarOpen((o) => !o)} />
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

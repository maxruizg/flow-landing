import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { MetaFunction } from "@remix-run/node";
import { motion } from "framer-motion";
import { StatCard } from "~/components/admin/StatCard";
import { RevenueChart } from "~/components/admin/RevenueChart";
import { RecentOrdersTable } from "~/components/admin/RecentOrdersTable";
import { getDashboardStats, getRevenueData, getAdminOrders } from "~/data/queries.server";
import { formatPrice } from "~/lib/utils";

export const meta: MetaFunction = () => [
  { title: "FLOW Admin — Dashboard" },
];

export async function loader() {
  const [dashboardStats, revenueData, adminOrders] = await Promise.all([
    getDashboardStats(),
    getRevenueData(),
    getAdminOrders(),
  ]);
  return json({ dashboardStats, revenueData, adminOrders });
}

export default function AdminDashboard() {
  const { dashboardStats, revenueData, adminOrders } = useLoaderData<typeof loader>();
  const recentOrders = adminOrders.slice(0, 5);

  const stats = [
    {
      label: "Total Revenue",
      value: formatPrice(dashboardStats.totalRevenue),
      change: dashboardStats.revenueChange,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Orders Today",
      value: String(dashboardStats.ordersToday),
      change: dashboardStats.ordersChange,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      label: "Products",
      value: String(dashboardStats.totalProducts),
      change: 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      label: "Customers",
      value: String(dashboardStats.totalCustomers),
      change: 8.1,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} {...stat} index={i} />
        ))}
      </div>

      {/* Revenue chart */}
      <RevenueChart data={revenueData} />

      {/* Recent orders */}
      <RecentOrdersTable orders={recentOrders} />
    </motion.div>
  );
}

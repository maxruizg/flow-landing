import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { MetaFunction } from "@remix-run/node";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { cn, formatPrice } from "~/lib/utils";
import { getAdminOrders } from "~/data/queries.server";
import { AdminStatusBadge } from "~/components/admin/AdminStatusBadge";
import { OrderDetailPanel } from "~/components/admin/OrderDetailPanel";
import { AdminEmptyState } from "~/components/admin/AdminEmptyState";
import type { AdminOrder } from "~/lib/types";

export const meta: MetaFunction = () => [{ title: "FLOW Admin — Orders" }];

const statusTabs = ["all", "processing", "shipped", "delivered", "cancelled"] as const;

export async function loader() {
  const adminOrders = await getAdminOrders();
  return json({ adminOrders });
}

export default function AdminOrders() {
  const { adminOrders } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const filtered = useMemo(() => {
    return adminOrders.filter((o) => {
      const matchStatus = activeTab === "all" || o.status === activeTab;
      const matchSearch =
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.customerName.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [adminOrders, activeTab, search]);

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
          {statusTabs.map((tab) => (
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
              {tab}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search orders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-flow-950 border border-flow-700 rounded-lg px-4 py-2.5 text-sm text-flow-100 placeholder:text-flow-500 focus:border-accent-500 focus:outline-none transition-colors sm:max-w-xs"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <AdminEmptyState
          icon={
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          message="No orders match your filters."
        />
      ) : (
        <div className="bg-flow-900 border border-flow-800/50 rounded-xl overflow-hidden">
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-flow-800/30">
                  <th className="text-left text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">Order</th>
                  <th className="text-left text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">Customer</th>
                  <th className="text-left text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">Date</th>
                  <th className="text-left text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">Items</th>
                  <th className="text-left text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">Total</th>
                  <th className="text-left text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="border-b border-flow-800/30 last:border-0 hover:bg-flow-800/50 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3 text-sm text-white font-medium">{order.id}</td>
                    <td className="px-5 py-3 text-sm text-flow-300">{order.customerName}</td>
                    <td className="px-5 py-3 text-sm text-flow-400">{order.date}</td>
                    <td className="px-5 py-3 text-sm text-flow-400">{order.items.length}</td>
                    <td className="px-5 py-3 text-sm text-white">{formatPrice(order.total)}</td>
                    <td className="px-5 py-3"><AdminStatusBadge status={order.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y divide-flow-800/30">
            {filtered.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="p-4 space-y-2 cursor-pointer hover:bg-flow-800/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white font-medium">{order.id}</span>
                  <AdminStatusBadge status={order.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-flow-400">{order.customerName}</span>
                  <span className="text-sm text-white">{formatPrice(order.total)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-flow-500">
                  <span>{order.date}</span>
                  <span>{order.items.length} item{order.items.length > 1 ? "s" : ""}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <OrderDetailPanel
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
      />
    </motion.div>
  );
}

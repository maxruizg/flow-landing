import { Link } from "@remix-run/react";
import { motion } from "framer-motion";
import type { AdminOrder } from "~/data/admin-mock";
import { AdminStatusBadge } from "./AdminStatusBadge";
import { formatPrice } from "~/lib/utils";

interface RecentOrdersTableProps {
  orders: AdminOrder[];
}

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-flow-900 border border-flow-800/50 rounded-xl"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-flow-800/30">
        <h3 className="text-xs uppercase tracking-wide text-flow-500 font-medium">
          Recent Orders
        </h3>
        <Link
          to="/admin/orders"
          className="text-xs text-accent-500 hover:text-accent-400 transition-colors"
        >
          View All
        </Link>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-flow-800/30">
              <th className="text-left text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">Order</th>
              <th className="text-left text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">Customer</th>
              <th className="text-left text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">Date</th>
              <th className="text-left text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">Total</th>
              <th className="text-left text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-flow-800/30 last:border-0 hover:bg-flow-800/50 transition-colors">
                <td className="px-5 py-3 text-sm text-white font-medium">{order.id}</td>
                <td className="px-5 py-3 text-sm text-flow-300">{order.customerName}</td>
                <td className="px-5 py-3 text-sm text-flow-400">{order.date}</td>
                <td className="px-5 py-3 text-sm text-white">{formatPrice(order.total)}</td>
                <td className="px-5 py-3"><AdminStatusBadge status={order.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-flow-800/30">
        {orders.map((order) => (
          <div key={order.id} className="px-5 py-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white font-medium">{order.id}</span>
              <AdminStatusBadge status={order.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-flow-400">{order.customerName}</span>
              <span className="text-sm text-white">{formatPrice(order.total)}</span>
            </div>
            <p className="text-xs text-flow-500">{order.date}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

import type { MetaFunction } from "@remix-run/node";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { formatPrice } from "~/lib/utils";
import { adminCustomers } from "~/data/admin-mock";
import { AdminEmptyState } from "~/components/admin/AdminEmptyState";

export const meta: MetaFunction = () => [{ title: "FLOW Admin — Customers" }];

export default function AdminCustomers() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return adminCustomers;
    const q = search.toLowerCase();
    return adminCustomers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <input
        type="text"
        placeholder="Search customers..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="bg-flow-950 border border-flow-700 rounded-lg px-4 py-2.5 text-sm text-flow-100 placeholder:text-flow-500 focus:border-accent-500 focus:outline-none transition-colors w-full sm:max-w-xs"
      />

      {filtered.length === 0 ? (
        <AdminEmptyState
          icon={
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          message="No customers match your search."
        />
      ) : (
        <div className="bg-flow-900 border border-flow-800/50 rounded-xl overflow-hidden">
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-flow-800/30">
                  <th className="text-left text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">Customer</th>
                  <th className="text-left text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">Email</th>
                  <th className="text-left text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">Orders</th>
                  <th className="text-left text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">Total Spent</th>
                  <th className="text-left text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">Joined</th>
                  <th className="text-left text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">Last Order</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr key={customer.id} className="border-b border-flow-800/30 last:border-0 hover:bg-flow-800/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-flow-800 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-white">
                            {customer.name.split(" ").map((n) => n[0]).join("")}
                          </span>
                        </div>
                        <span className="text-sm text-white font-medium">{customer.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-flow-400">{customer.email}</td>
                    <td className="px-5 py-3 text-sm text-flow-300">{customer.totalOrders}</td>
                    <td className="px-5 py-3 text-sm text-white">{formatPrice(customer.totalSpent)}</td>
                    <td className="px-5 py-3 text-sm text-flow-400">{customer.joinedDate}</td>
                    <td className="px-5 py-3 text-sm text-flow-400">{customer.lastOrderDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-flow-800/30">
            {filtered.map((customer) => (
              <div key={customer.id} className="p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-flow-800 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-white">
                      {customer.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{customer.name}</p>
                    <p className="text-xs text-flow-500">{customer.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-flow-400">{customer.totalOrders} orders</span>
                  <span className="text-white font-medium">{formatPrice(customer.totalSpent)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-flow-500">
                  <span>Joined {customer.joinedDate}</span>
                  <span>Last order {customer.lastOrderDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

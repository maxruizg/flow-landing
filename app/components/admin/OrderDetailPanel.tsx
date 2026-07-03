import { useEffect, useState } from "react";
import { useFetcher } from "@remix-run/react";
import { SlidePanel } from "~/components/layout/SlidePanel";
import { AdminStatusBadge } from "./AdminStatusBadge";
import { cn, formatPrice, formatShippingAddress } from "~/lib/utils";
import { ORDER_STATUS_TRANSITIONS, type OrderStatus } from "~/lib/order-status";
import type { AdminOrder } from "~/lib/types";

/** AdminOrder plus the optional tracking fields the orders loader exposes
 *  (null/absent until the tracking migration is applied). */
type AdminOrderWithTracking = AdminOrder & {
  trackingNumber?: string | null;
  carrier?: string | null;
};

interface OrderDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  order: AdminOrderWithTracking | null;
}

export function OrderDetailPanel({ isOpen, onClose, order }: OrderDetailPanelProps) {
  const fetcher = useFetcher<{ ok?: boolean; error?: string; warning?: string }>();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");

  // Reset the cancel confirmation + tracking draft whenever a different
  // order is opened.
  const orderId = order?.id ?? null;
  useEffect(() => {
    setConfirmCancel(false);
    setTrackingNumber("");
  }, [orderId]);

  if (!order) return null;

  const addressLines = formatShippingAddress(order.shippingAddress);
  const nextStatuses = ORDER_STATUS_TRANSITIONS[order.status] ?? [];
  const isUpdating = fetcher.state !== "idle";

  const submitStatus = (status: OrderStatus) => {
    const payload: Record<string, string> = {
      intent: "update-status",
      id: order.id,
      status,
    };
    // Only the shipped transition carries an (optional) tracking number.
    if (status === "shipped" && trackingNumber.trim()) {
      payload.trackingNumber = trackingNumber.trim();
    }
    fetcher.submit(payload, { method: "post" });
    setConfirmCancel(false);
  };

  return (
    <SlidePanel isOpen={isOpen} onClose={onClose} title={`Order ${order.id}`}>
      <div className="space-y-6">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-flow-500 uppercase tracking-wide">Status</span>
          <AdminStatusBadge status={order.status} />
        </div>

        {/* Status actions */}
        {nextStatuses.length > 0 && (
          <div className="bg-flow-950 border border-flow-800/50 rounded-lg p-4">
            <h4 className="text-xs text-flow-500 uppercase tracking-wide mb-3">
              Update Status
            </h4>
            {nextStatuses.includes("shipped") && (
              <div className="mb-3">
                <label
                  htmlFor="tracking-number"
                  className="block text-xs text-flow-500 mb-1.5"
                >
                  DHL tracking number{" "}
                  <span className="text-flow-600">(optional)</span>
                </label>
                <input
                  id="tracking-number"
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. 1234567890"
                  disabled={isUpdating}
                  className="w-full bg-flow-900 border border-flow-700 rounded-lg px-3 py-2 text-sm text-flow-100 placeholder:text-flow-600 focus:border-accent-500 focus:outline-none transition-colors disabled:opacity-50"
                />
                <p className="text-[11px] text-flow-600 mt-1.5">
                  Included in the shipping email — leave empty to ship without
                  tracking.
                </p>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {nextStatuses
                .filter((s) => s !== "cancelled")
                .map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={isUpdating}
                    onClick={() => submitStatus(s)}
                    className="px-4 py-2 rounded-lg text-xs font-display font-semibold uppercase tracking-wide bg-white text-flow-black hover:bg-flow-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? "Updating…" : `Mark as ${s}`}
                  </button>
                ))}
              {nextStatuses.includes("cancelled") &&
                (confirmCancel ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => submitStatus("cancelled")}
                      className="px-4 py-2 rounded-lg text-xs font-display font-semibold uppercase tracking-wide bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdating ? "Cancelling…" : "Confirm Cancel"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmCancel(false)}
                      className="px-3 py-2 rounded-lg text-xs font-medium uppercase tracking-wide text-flow-400 hover:text-white transition-colors"
                    >
                      Keep
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => setConfirmCancel(true)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-xs font-display font-semibold uppercase tracking-wide border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                    )}
                  >
                    Cancel Order
                  </button>
                ))}
            </div>
            {fetcher.data?.error && (
              <p className="text-xs text-red-400 mt-3">{fetcher.data.error}</p>
            )}
            {fetcher.data?.warning && (
              <p className="text-xs text-amber-400 mt-3">{fetcher.data.warning}</p>
            )}
          </div>
        )}

        {/* Tracking info (shipped / delivered orders) */}
        {order.trackingNumber && (
          <div className="bg-flow-950 border border-flow-800/50 rounded-lg p-4 space-y-2">
            <h4 className="text-xs text-flow-500 uppercase tracking-wide mb-3">
              Tracking
            </h4>
            <div className="flex items-center justify-between">
              <span className="text-sm text-flow-400">
                {order.carrier || "DHL"}
              </span>
              <span className="text-sm text-white font-mono">
                {order.trackingNumber}
              </span>
            </div>
          </div>
        )}

        {/* Customer info */}
        <div className="bg-flow-950 border border-flow-800/50 rounded-lg p-4 space-y-2">
          <h4 className="text-xs text-flow-500 uppercase tracking-wide mb-3">Customer</h4>
          <p className="text-sm text-white">{order.customerName}</p>
          <p className="text-sm text-flow-400">{order.customerEmail}</p>
        </div>

        {/* Shipping */}
        <div className="bg-flow-950 border border-flow-800/50 rounded-lg p-4 space-y-2">
          <h4 className="text-xs text-flow-500 uppercase tracking-wide mb-3">Shipping Address</h4>
          {addressLines.length > 0 ? (
            <address className="not-italic text-sm text-flow-300 leading-relaxed">
              {addressLines.map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </address>
          ) : (
            <p className="text-sm text-flow-500 italic">No shipping address on file</p>
          )}
        </div>

        {/* Line items */}
        <div>
          <h4 className="text-xs text-flow-500 uppercase tracking-wide mb-3">Items</h4>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-flow-950 border border-flow-800/50 rounded-lg p-4"
              >
                <div>
                  <p className="text-sm text-white">
                    {item.productName}
                    {item.colorName ? ` — ${item.colorName}` : ""}
                  </p>
                  <p className="text-xs text-flow-500">
                    Size: {item.size} &middot; Qty: {item.quantity}
                  </p>
                </div>
                <span className="text-sm text-white font-medium">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between pt-4 border-t border-flow-800/50">
          <span className="text-sm text-flow-400">Total</span>
          <span className="text-lg font-display font-bold text-white">
            {formatPrice(order.total)}
          </span>
        </div>

        {/* Date */}
        <p className="text-xs text-flow-500 text-center">
          Placed on {order.date}
        </p>
      </div>
    </SlidePanel>
  );
}

import { SlidePanel } from "~/components/layout/SlidePanel";
import { AdminStatusBadge } from "./AdminStatusBadge";
import { formatPrice, formatShippingAddress } from "~/lib/utils";
import type { AdminOrder } from "~/lib/types";

interface OrderDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  order: AdminOrder | null;
}

export function OrderDetailPanel({ isOpen, onClose, order }: OrderDetailPanelProps) {
  if (!order) return null;

  const addressLines = formatShippingAddress(order.shippingAddress);

  return (
    <SlidePanel isOpen={isOpen} onClose={onClose} title={`Order ${order.id}`}>
      <div className="space-y-6">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-flow-500 uppercase tracking-wide">Status</span>
          <AdminStatusBadge status={order.status} />
        </div>

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

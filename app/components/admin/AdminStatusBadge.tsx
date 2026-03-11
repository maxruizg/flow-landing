import { cn } from "~/lib/utils";

type OrderStatus = "processing" | "shipped" | "delivered" | "cancelled";

const statusStyles: Record<OrderStatus, string> = {
  processing: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  shipped: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  delivered: "bg-green-500/10 text-green-400 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

export function AdminStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize",
        statusStyles[status]
      )}
    >
      {status}
    </span>
  );
}

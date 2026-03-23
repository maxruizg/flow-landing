import { motion } from "framer-motion";
import type { RevenueDataPoint } from "~/lib/types";
import { formatPrice } from "~/lib/utils";

interface RevenueChartProps {
  data: RevenueDataPoint[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-flow-900 border border-flow-800/50 rounded-xl p-5"
    >
      <h3 className="text-xs uppercase tracking-wide text-flow-500 font-medium mb-6">
        Revenue (6 months)
      </h3>
      <div className="flex items-end gap-3 h-40">
        {data.map((point, i) => {
          const height = (point.revenue / maxRevenue) * 100;
          return (
            <div key={point.month} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-[10px] text-flow-400">{formatPrice(point.revenue)}</span>
              <motion.div
                className="w-full bg-accent-500 rounded-t-md"
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
              />
              <span className="text-[11px] text-flow-500">{point.month}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

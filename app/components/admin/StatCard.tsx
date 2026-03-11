import { motion } from "framer-motion";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: number;
  index: number;
}

export function StatCard({ icon, label, value, change, index }: StatCardProps) {
  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="bg-flow-900 border border-flow-800/50 rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-flow-500">{icon}</span>
        <span
          className={`text-xs font-medium ${
            isPositive ? "text-green-400" : "text-red-400"
          }`}
        >
          {isPositive ? "+" : ""}
          {change}%
        </span>
      </div>
      <p className="text-2xl font-display font-bold text-white">{value}</p>
      <p className="text-xs text-flow-500 mt-1">{label}</p>
    </motion.div>
  );
}

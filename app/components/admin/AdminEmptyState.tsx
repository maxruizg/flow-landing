import { motion } from "framer-motion";

interface AdminEmptyStateProps {
  icon: React.ReactNode;
  message: string;
}

export function AdminEmptyState({ icon, message }: AdminEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="text-flow-500 mb-4">{icon}</div>
      <p className="text-flow-400 text-sm">{message}</p>
    </motion.div>
  );
}

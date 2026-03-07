import { motion, AnimatePresence } from "framer-motion";

interface QuickAddProps {
  sizes: string[];
  visible: boolean;
}

export function QuickAdd({ sizes, visible }: QuickAddProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-flow-black/90 backdrop-blur-sm px-3 py-3"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <p className="text-[10px] uppercase tracking-[0.2em] text-flow-400 mb-2">
            Quick Add
          </p>
          <div className="flex gap-1.5">
            {sizes.map((size) => (
              <button
                key={size}
                className="flex-1 py-1.5 text-xs font-medium text-flow-200 border border-flow-700 rounded-full hover:bg-white hover:text-flow-black hover:border-white transition-all duration-200"
              >
                {size}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

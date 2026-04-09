import { motion } from "framer-motion";
import type { Banner } from "~/lib/types";

interface TopBannerProps {
  banner: Banner;
}

export function TopBanner({ banner }: TopBannerProps) {
  return (
    <motion.div
      initial={{ y: "-100%" }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
      className="relative w-full bg-white text-flow-black overflow-hidden"
    >
      {/* Animated sweep */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-flow-black/5 to-transparent pointer-events-none"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 4, repeat: Infinity, repeatDelay: 3, ease: "linear" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-10 md:h-11 flex items-center justify-center gap-2 sm:gap-3">
        {/* Pulsing dot */}
        <span className="relative flex shrink-0">
          <span className="absolute inline-flex h-2 w-2 rounded-full bg-flow-black opacity-75 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-flow-black" />
        </span>

        <p className="text-[10px] md:text-[11px] font-display font-semibold uppercase tracking-[0.2em] text-flow-black truncate">
          {banner.title}
        </p>

        {banner.description && (
          <>
            <span className="hidden sm:inline text-flow-500">·</span>
            <p className="hidden sm:inline text-[10px] md:text-[11px] tracking-wide text-flow-600 truncate">
              {banner.description}
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
}

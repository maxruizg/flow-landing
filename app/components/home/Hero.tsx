import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Container } from "~/components/ui/Container";
import { Button } from "~/components/ui/Button";
import type { Collection, Banner } from "~/lib/types";
import { MediaBackground } from "~/components/ui/MediaBackground";

interface HeroProps {
  collection: Collection;
  banner?: Banner | null;
}

export function Hero({ collection, banner }: HeroProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  return (
    <div ref={ref} className="relative h-full w-full overflow-hidden bg-flow-black">
      {/* Parallax background */}
      <motion.div className="absolute inset-0" style={{ y }}>
        <MediaBackground
          src={collection.image}
          video={collection.video}
          alt={collection.name}
          widths={[960, 1280, 1920]}
          sizes="100vw"
          className="w-full h-[130%] object-cover"
          loading="eager"
        />
      </motion.div>

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-flow-black via-flow-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-flow-black/60 to-transparent" />

      {/* Banner */}
      {banner && (
        <motion.div
          className="absolute top-0 left-0 right-0 z-10 overflow-hidden"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.33, 1, 0.68, 1] }}
        >
          <div className="relative bg-flow-black/70 backdrop-blur-md border-b border-white/10">
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "linear" }}
            />

            <div className="relative px-4 py-3 md:py-4 text-center">
              <motion.p
                className="text-[11px] md:text-xs font-display font-semibold uppercase tracking-[0.25em] text-white"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                {banner.title}
              </motion.p>
              {banner.description && (
                <motion.p
                  className="text-[10px] md:text-[11px] text-flow-400 mt-1 tracking-wide"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  {banner.description}
                </motion.p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Content */}
      <Container className="relative h-full flex flex-col justify-end pt-24 pb-16 md:pb-24">
        <motion.span
          className="text-xs uppercase tracking-[0.3em] text-flow-400 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {collection.season} Collection
        </motion.span>

        <motion.h1
          className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight text-white leading-[0.9] mb-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
        >
          {collection.name}
        </motion.h1>

        <motion.div
          className="flex flex-wrap gap-3 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          {[
            { label: "Men's", gender: "men" },
            { label: "Women's", gender: "women" },
            { label: "For All", gender: "unisex" },
          ].map(({ label, gender }) => (
            <a
              key={gender}
              href={`/showroom?gender=${gender}`}
              className="text-xs uppercase tracking-[0.2em] text-flow-400 border border-flow-700 px-3 py-1.5 rounded-full hover:text-white hover:border-flow-400 transition-colors"
            >
              {label}
            </a>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
        >
          <a href="/showroom">
            <Button size="lg">Explore Collection</Button>
          </a>
        </motion.div>

        {/* Scroll indicator — hidden on mobile to avoid overlapping the CTA */}
        <motion.div
          className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-flow-500">Scroll</span>
          <motion.div
            className="w-px h-8 bg-flow-500"
            animate={{ scaleY: [1, 0.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "top" }}
          />
        </motion.div>
      </Container>
    </div>
  );
}

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Container } from "~/components/ui/Container";
import { Button } from "~/components/ui/Button";
import type { Collection } from "~/lib/types";

interface HeroProps {
  collection: Collection;
}

export function Hero({ collection }: HeroProps) {
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
        <img
          src={collection.image}
          alt={collection.name}
          className="w-full h-[130%] object-cover"
        />
      </motion.div>

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-flow-black via-flow-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-flow-black/60 to-transparent" />

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
            { label: "Unisex", gender: "unisex" },
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

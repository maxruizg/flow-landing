import { useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Container } from "~/components/ui/Container";
import { AnimatedText } from "~/components/ui/AnimatedText";
import { ProductCard } from "~/components/product/ProductCard";
import type { Product } from "~/data/mock";

interface BestSellersProps {
  products: Product[];
}

export function BestSellers({ products }: BestSellersProps) {
  const constraintsRef = useRef<HTMLDivElement>(null);
  const scrollSpeedRef = useRef(0);
  const rafRef = useRef<number>(0);
  const cursorZoneRef = useRef<"left" | "right" | null>(null);

  const scrollLoop = useCallback(() => {
    if (scrollSpeedRef.current !== 0 && constraintsRef.current) {
      constraintsRef.current.scrollLeft += scrollSpeedRef.current;
    }
    rafRef.current = requestAnimationFrame(scrollLoop);
  }, []);

  const startLoop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(scrollLoop);
  }, [scrollLoop]);

  const stopLoop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    scrollSpeedRef.current = 0;
    cursorZoneRef.current = null;
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = x / rect.width;
      const maxSpeed = 12;

      if (ratio < 0.3) {
        // Left zone: speed increases toward left edge
        const intensity = 1 - ratio / 0.3;
        scrollSpeedRef.current = -maxSpeed * intensity;
        if (cursorZoneRef.current !== "left") {
          cursorZoneRef.current = "left";
          startLoop();
        }
      } else if (ratio > 0.7) {
        // Right zone: speed increases toward right edge
        const intensity = (ratio - 0.7) / 0.3;
        scrollSpeedRef.current = maxSpeed * intensity;
        if (cursorZoneRef.current !== "right") {
          cursorZoneRef.current = "right";
          startLoop();
        }
      } else {
        // Dead zone
        scrollSpeedRef.current = 0;
        cursorZoneRef.current = null;
      }
    },
    [startLoop],
  );

  const getCursor = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    if (ratio < 0.3) return "w-resize";
    if (ratio > 0.7) return "e-resize";
    return "grab";
  }, []);

  return (
    <section id="best-sellers" className="bg-flow-black py-20 md:py-28 overflow-hidden">
      <Container>
        <div className="mb-12">
          <span className="text-xs uppercase tracking-[0.3em] text-flow-500 mb-2 block">
            Top Picks
          </span>
          <AnimatedText
            text="Best Sellers"
            as="h2"
            className="font-display text-4xl md:text-5xl font-bold tracking-tight text-white"
          />
        </div>
      </Container>

      {/* Drag carousel with mouse-position auto-scroll */}
      <div
        ref={constraintsRef}
        className="overflow-hidden"
        onMouseMove={(e) => {
          handleMouseMove(e);
          e.currentTarget.style.cursor = getCursor(e);
        }}
        onMouseLeave={(e) => {
          stopLoop();
          e.currentTarget.style.cursor = "grab";
        }}
      >
        <motion.div
          className="flex gap-4 md:gap-6 pl-4 sm:pl-6 lg:pl-[max(2rem,calc((100vw-80rem)/2+2rem))] active:cursor-grabbing"
          drag="x"
          dragConstraints={constraintsRef}
          dragElastic={0.1}
        >
          {products.map((product, i) => (
            <div key={product.id} className="w-[280px] md:w-[340px] flex-shrink-0">
              <ProductCard product={product} index={i} />
            </div>
          ))}
          {/* Spacer */}
          <div className="w-8 flex-shrink-0" />
        </motion.div>
      </div>
    </section>
  );
}

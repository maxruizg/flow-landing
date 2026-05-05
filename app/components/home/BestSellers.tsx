import { useRef, useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Container } from "~/components/ui/Container";
import { AnimatedText } from "~/components/ui/AnimatedText";
import { ProductCard } from "~/components/product/ProductCard";
import { expandToVariantCards } from "~/lib/variant-cards";
import type { Product } from "~/lib/types";

interface BestSellersProps {
  products: Product[];
}

export function BestSellers({ products }: BestSellersProps) {
  const constraintsRef = useRef<HTMLDivElement>(null);
  const scrollSpeedRef = useRef(0);
  const rafRef = useRef<number>(0);
  const cursorZoneRef = useRef<"left" | "right" | null>(null);
  // Cache the bounding rect once per pointer-enter so mousemove can stay
  // cheap (reading layout on every event was a hot INP path).
  const rectRef = useRef<{ left: number; width: number } | null>(null);
  const lastClientXRef = useRef(0);
  const moveScheduledRef = useRef(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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

  const applyMove = useCallback(
    (el: HTMLDivElement) => {
      moveScheduledRef.current = false;
      const rect = rectRef.current;
      if (!rect) return;
      const ratio = (lastClientXRef.current - rect.left) / rect.width;
      const maxSpeed = 12;

      if (ratio < 0.3) {
        scrollSpeedRef.current = -maxSpeed * (1 - ratio / 0.3);
        if (cursorZoneRef.current !== "left") {
          cursorZoneRef.current = "left";
          el.style.cursor = "w-resize";
          startLoop();
        }
      } else if (ratio > 0.7) {
        scrollSpeedRef.current = maxSpeed * ((ratio - 0.7) / 0.3);
        if (cursorZoneRef.current !== "right") {
          cursorZoneRef.current = "right";
          el.style.cursor = "e-resize";
          startLoop();
        }
      } else {
        scrollSpeedRef.current = 0;
        if (cursorZoneRef.current !== null) {
          cursorZoneRef.current = null;
          el.style.cursor = "grab";
        }
      }
    },
    [startLoop],
  );

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    rectRef.current = { left: r.left, width: r.width };
    e.currentTarget.style.cursor = "grab";
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      lastClientXRef.current = e.clientX;
      if (moveScheduledRef.current) return;
      moveScheduledRef.current = true;
      const el = e.currentTarget;
      requestAnimationFrame(() => applyMove(el));
    },
    [applyMove],
  );

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
        className="overflow-x-auto overflow-y-hidden md:overflow-hidden scrollbar-hide"
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={(e) => {
          stopLoop();
          rectRef.current = null;
          e.currentTarget.style.cursor = "grab";
        }}
      >
        <motion.div
          className="flex gap-4 md:gap-6 pl-4 sm:pl-6 lg:pl-[max(2rem,calc((100vw-80rem)/2+2rem))] active:cursor-grabbing"
          drag={isMobile ? false : "x"}
          dragConstraints={constraintsRef}
          dragElastic={0.1}
        >
          {expandToVariantCards(products)
            .filter((c) => c.variant.badge === "Best Seller")
            .map(({ product, variant: v }, i) => (
            <div key={`${product.id}-${v.id}`} className="w-[200px] sm:w-[280px] md:w-[340px] flex-shrink-0">
              <ProductCard product={product} initialVariant={v} index={i} />
            </div>
          ))}
          {/* Spacer */}
          <div className="w-8 flex-shrink-0" />
        </motion.div>
      </div>
    </section>
  );
}

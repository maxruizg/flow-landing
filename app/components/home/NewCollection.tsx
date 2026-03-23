import { useRef, useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Container } from "~/components/ui/Container";
import { AnimatedText } from "~/components/ui/AnimatedText";
import { ProductCard } from "~/components/product/ProductCard";
import type { Product } from "~/lib/types";

interface NewCollectionProps {
  products: Product[];
}

export function NewCollection({ products }: NewCollectionProps) {
  const constraintsRef = useRef<HTMLDivElement>(null);
  const scrollSpeedRef = useRef(0);
  const rafRef = useRef<number>(0);
  const cursorZoneRef = useRef<"left" | "right" | null>(null);
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

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = x / rect.width;
      const maxSpeed = 12;

      if (ratio < 0.3) {
        const intensity = 1 - ratio / 0.3;
        scrollSpeedRef.current = -maxSpeed * intensity;
        if (cursorZoneRef.current !== "left") {
          cursorZoneRef.current = "left";
          startLoop();
        }
      } else if (ratio > 0.7) {
        const intensity = (ratio - 0.7) / 0.3;
        scrollSpeedRef.current = maxSpeed * intensity;
        if (cursorZoneRef.current !== "right") {
          cursorZoneRef.current = "right";
          startLoop();
        }
      } else {
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
    <section id="new-collection" className="bg-flow-100 text-flow-black py-20 md:py-28 overflow-hidden rounded-t-2xl">
      <Container>
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-flow-500 mb-2 block">
              Latest Drop
            </span>
            <AnimatedText
              text="New Collection"
              as="h2"
              className="font-display text-4xl md:text-5xl font-bold tracking-tight text-flow-black"
            />
          </div>
          <a
            href="/showroom"
            className="link-underline text-xs uppercase tracking-[0.2em] text-flow-600 hover:text-flow-black transition-colors hidden md:block"
          >
            View All
          </a>
        </div>
      </Container>

      <div
        ref={constraintsRef}
        className="overflow-x-auto overflow-y-hidden md:overflow-hidden scrollbar-hide"
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
          drag={isMobile ? false : "x"}
          dragConstraints={constraintsRef}
          dragElastic={0.1}
        >
          {products.map((product, i) => (
            <div key={product.id} className="w-[200px] sm:w-[280px] md:w-[340px] flex-shrink-0">
              <ProductCard product={product} index={i} variant="light" />
            </div>
          ))}
          <div className="w-8 flex-shrink-0" />
        </motion.div>
      </div>
    </section>
  );
}

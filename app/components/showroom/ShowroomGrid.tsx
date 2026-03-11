import { useState, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup, useReducedMotion } from "framer-motion";
import { Container } from "~/components/ui/Container";
import { Button } from "~/components/ui/Button";
import { ProductCard } from "~/components/product/ProductCard";
import type { Product } from "~/data/mock";

interface ShowroomGridProps {
  products: Product[];
  onClearFilters: () => void;
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: i * 0.04,
      duration: 0.3,
      ease: [0.33, 1, 0.68, 1],
    },
  }),
  exit: {
    opacity: 0,
    scale: 0.9,
    y: -10,
    transition: { duration: 0.25 },
  },
};

const reducedVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0 } },
  exit: { opacity: 0, transition: { duration: 0 } },
};

export function ShowroomGrid({ products, onClearFilters }: ShowroomGridProps) {
  const prefersReducedMotion = useReducedMotion();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const variants = prefersReducedMotion ? reducedVariants : cardVariants;

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToFilters = () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  };

  if (products.length === 0) {
    return (
      <Container className="py-32">
        <motion.div
          className="flex flex-col items-center justify-center text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: prefersReducedMotion ? 0 : 0.4 }}
        >
          <svg
            className="w-16 h-16 text-flow-700 mb-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <p className="text-flow-400 text-lg mb-2">No pieces match your filters</p>
          <p className="text-flow-600 text-sm mb-8">Try adjusting your selection</p>
          <Button variant="outline" onClick={onClearFilters}>
            Clear Filters
          </Button>
        </motion.div>
      </Container>
    );
  }

  return (
    <>
      <Container className="py-10 md:py-14">
        <LayoutGroup>
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5"
            layout={!prefersReducedMotion}
            transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
          >
            <AnimatePresence mode="popLayout">
              {products.map((product, i) => (
                <motion.div
                  key={product.id}
                  custom={i}
                  variants={variants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout={!prefersReducedMotion}
                  transition={{ layout: { duration: 0.4, ease: [0.33, 1, 0.68, 1] } }}
                >
                  <ProductCard product={product} index={0} variant="dark" />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      </Container>

      {/* Back to top */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            type="button"
            onClick={scrollToFilters}
            className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-white text-flow-black flex items-center justify-center shadow-lg hover:bg-flow-200 transition-colors"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            aria-label="Back to top"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}

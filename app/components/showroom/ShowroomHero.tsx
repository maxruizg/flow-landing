import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Container } from "~/components/ui/Container";
import { AnimatedText } from "~/components/ui/AnimatedText";

export function ShowroomHero() {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);

  return (
    <div ref={ref} className="relative h-[50vh] md:h-[60vh] w-full overflow-hidden bg-flow-black">
      {/* Parallax background */}
      <motion.div
        className="absolute inset-0"
        style={prefersReducedMotion ? undefined : { y }}
      >
        <img
          src="/images/editorial/collection-ltmf.jpg"
          alt="FLOW Urban Wear showroom"
          className="w-full h-[130%] object-cover"
        />
      </motion.div>

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-flow-black via-flow-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-flow-black/60 to-transparent" />

      {/* Content */}
      <Container className="relative h-full flex flex-col justify-end pb-12 md:pb-16">
        <motion.span
          className="text-xs uppercase tracking-[0.3em] text-flow-400 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: prefersReducedMotion ? 0 : 0.6 }}
        >
          The Showroom
        </motion.span>

        <AnimatedText
          text="Explore the Collection"
          as="h1"
          className="font-display text-5xl md:text-7xl font-bold tracking-tight text-white mb-4"
          delay={0.5}
        />

        <motion.p
          className="text-flow-300 max-w-md text-sm md:text-base leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: prefersReducedMotion ? 0 : 0.6 }}
        >
          36 pieces. Made in Mexico. Curated for those who move with intention.
        </motion.p>
      </Container>
    </div>
  );
}

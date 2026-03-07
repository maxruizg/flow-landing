import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Container } from "~/components/ui/Container";

const words = "WE DON'T FOLLOW TRENDS. WE SET THE PACE.".split(" ");

export function Manifesto() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "start 0.2"],
  });

  return (
    <section
      id="manifesto"
      ref={ref}
      className="relative bg-flow-black py-32 md:py-48 overflow-hidden noise-overlay"
    >
      <Container className="relative z-10">
        <p className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-center max-w-5xl mx-auto">
          {words.map((word, i) => {
            const start = i / words.length;
            const end = start + 1 / words.length;
            return <Word key={i} word={word} range={[start, end]} progress={scrollYProgress} />;
          })}
        </p>
      </Container>
    </section>
  );
}

function Word({
  word,
  range,
  progress,
}: {
  word: string;
  range: [number, number];
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const opacity = useTransform(progress, range, [0.15, 1]);

  return (
    <motion.span className="inline-block mr-[0.3em]" style={{ opacity }}>
      {word}
    </motion.span>
  );
}

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Container } from "~/components/ui/Container";

const words = "LESS THINKING MORE FLOW".split(" ");

const aboutVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.33, 1, 0.68, 1] },
  },
};

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
        <p className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold leading-[1.1] tracking-tight text-center max-w-5xl mx-auto">
          {words.map((word, i) => {
            const start = i / words.length;
            const end = start + 1 / words.length;
            return <Word key={i} word={word} range={[start, end]} progress={scrollYProgress} />;
          })}
        </p>

        {/* About Us */}
        <motion.div
          className="mt-20 md:mt-28 flex flex-col items-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={aboutVariants}
        >
          <motion.div
            className="w-12 h-px bg-flow-600 mb-8"
            variants={itemVariants}
          />

          <motion.span
            className="text-[10px] uppercase tracking-[0.35em] text-flow-500 mb-6"
            variants={itemVariants}
          >
            About Us
          </motion.span>

          <motion.p
            className="text-lg sm:text-xl md:text-2xl text-flow-300 text-center max-w-2xl leading-relaxed font-light"
            variants={itemVariants}
          >
            Community based streetwear combining{" "}
            <span className="text-white font-medium">urban culture</span> with{" "}
            <span className="text-white font-medium">modern edge</span>.
          </motion.p>

          <motion.p
            className="mt-6 text-sm md:text-base text-flow-500 text-center tracking-wide"
            variants={itemVariants}
          >
            Created by{" "}
            <span className="text-white font-display font-semibold tracking-tight">
              DANY FLOW
            </span>{" "}
            from Mexico City.
          </motion.p>
        </motion.div>
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

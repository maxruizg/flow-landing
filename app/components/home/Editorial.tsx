import { motion } from "framer-motion";
import { Container } from "~/components/ui/Container";
import { AnimatedText } from "~/components/ui/AnimatedText";
import type { EditorialImage } from "~/data/mock";

interface EditorialProps {
  images: EditorialImage[];
}

export function Editorial({ images }: EditorialProps) {
  return (
    <section
      id="editorial"
      className="bg-flow-black py-20 md:py-28 h-full flex items-center"
    >
      <Container>
        <div className="mb-12">
          <span className="text-xs uppercase tracking-[0.3em] text-flow-500 mb-2 block">
            Lookbook
          </span>
          <AnimatedText
            text="The Editorial"
            as="h2"
            className="font-display text-4xl md:text-5xl font-bold tracking-tight text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 h-[60vh] md:h-[65vh]">
          {/* Left tall image */}
          <motion.div
            className="relative overflow-hidden group cursor-pointer"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <img
              src={images[0]?.src}
              alt={images[0]?.alt}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-flow-black/0 group-hover:bg-flow-black/30 transition-colors duration-500" />
            <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
              <p className="text-xs uppercase tracking-[0.2em] text-white">
                {images[0]?.caption}
              </p>
            </div>
          </motion.div>

          {/* Right stacked */}
          <div className="grid grid-rows-2 gap-4 md:gap-6">
            {images.slice(1, 3).map((img, i) => (
              <motion.div
                key={img.id}
                className="relative overflow-hidden group cursor-pointer"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 * (i + 1), duration: 0.6 }}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03] group-hover:rotate-[0.5deg]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-flow-black/0 group-hover:bg-flow-black/30 transition-colors duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                  <p className="text-xs uppercase tracking-[0.2em] text-white">
                    {img.caption}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

import { Container } from "~/components/ui/Container";
import { Button } from "~/components/ui/Button";
import type { Collection } from "~/lib/types";
import { MediaBackground } from "~/components/ui/MediaBackground";

interface HeroProps {
  collection: Collection;
}

/**
 * Above-the-fold hero. The previous implementation imported framer-motion at
 * the module level for entry-stagger animations and a parallax background —
 * both ran on the critical render path. This version uses pure CSS keyframes
 * (declared in app/styles/global.css) and a static background image, dropping
 * framer-motion from the homepage's initial JS chunk entirely.
 */
export function Hero({ collection }: HeroProps) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-flow-black">
      {/* Static background — no JS parallax to keep the LCP element on the
          fast path. */}
      <div className="absolute inset-0">
        <MediaBackground
          src={collection.image}
          video={collection.video}
          alt={collection.name}
          widths={[960, 1280, 1920]}
          sizes="100vw"
          className="w-full h-full object-cover"
          loading="eager"
          priority
        />
      </div>

      {/* Dark gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-flow-black via-flow-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-flow-black/60 to-transparent" />

      {/* Content */}
      <Container className="relative h-full flex flex-col justify-end pt-32 pb-20 md:pt-24 md:pb-24">
        <span
          className="text-xs uppercase tracking-[0.3em] text-flow-400 mb-3 md:mb-4 hero-fade hero-fade-1"
        >
          {collection.season} Collection
        </span>

        <h1
          className="font-display text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight text-white leading-[0.9] mb-4 md:mb-6 hero-fade hero-fade-2"
        >
          {collection.name}
        </h1>

        <div className="flex flex-wrap gap-3 mb-8 hero-fade hero-fade-3">
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
        </div>

        <div className="hero-fade hero-fade-4">
          <a href="/showroom">
            <Button size="lg">Explore Collection</Button>
          </a>
        </div>

        {/* Scroll indicator — hidden on mobile to avoid overlapping the CTA */}
        <div className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 hero-fade hero-fade-5">
          <span className="text-[10px] uppercase tracking-[0.3em] text-flow-500">Scroll</span>
          <span className="block w-px h-8 bg-flow-500 hero-scroll-pulse origin-top" />
        </div>
      </Container>
    </div>
  );
}

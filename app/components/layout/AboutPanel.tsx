import { SlidePanel } from "./SlidePanel";
import { brand } from "~/data/brand";

interface AboutPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutPanel({ isOpen, onClose }: AboutPanelProps) {
  return (
    <SlidePanel isOpen={isOpen} onClose={onClose} title="About Flow">
      <div className="space-y-8 py-4">
        <section>
          <h3 className="text-xs uppercase tracking-[0.2em] text-white mb-3">
            Our Story
          </h3>
          <p className="text-sm text-flow-300 leading-relaxed">
            {brand.story}
          </p>
        </section>

        <section>
          <h3 className="text-xs uppercase tracking-[0.2em] text-white mb-3">
            Philosophy
          </h3>
          <p className="text-sm text-flow-300 leading-relaxed">
            <span className="text-white font-medium">{brand.tagline}</span> — the art of letting things happen, without trying to control them. FLOW is about self-expression, creativity, and authenticity.
          </p>
        </section>

        <section>
          <h3 className="text-xs uppercase tracking-[0.2em] text-white mb-3">
            What We Make
          </h3>
          <p className="text-sm text-flow-300 leading-relaxed">
            Streetwear rooted in Mexico City culture — hoodies, tees, crop tops, shorts, and accessories designed for those who move with intention.
          </p>
        </section>

        <section>
          <h3 className="text-xs uppercase tracking-[0.2em] text-white mb-3">
            Based In
          </h3>
          <p className="text-sm text-flow-300 leading-relaxed">
            {brand.origin}
          </p>
        </section>
      </div>
    </SlidePanel>
  );
}

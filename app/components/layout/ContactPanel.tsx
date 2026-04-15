import { SlidePanel } from "./SlidePanel";

interface ContactPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const CONTACT_EMAIL = "contact@flowurbanwear.com";

export function ContactPanel({ isOpen, onClose }: ContactPanelProps) {
  return (
    <SlidePanel isOpen={isOpen} onClose={onClose} title="Contact">
      <div className="py-4">
        <p className="text-xs uppercase tracking-[0.2em] text-flow-500 mb-3">
          Reach Us
        </p>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="block text-lg md:text-xl text-white font-display font-medium underline underline-offset-4 decoration-flow-700 hover:decoration-white transition-colors"
        >
          {CONTACT_EMAIL}
        </a>
        <p className="text-sm text-flow-500 leading-relaxed mt-4">
          We answer inquiries about orders, custom drops, and press within two business days.
        </p>
      </div>
    </SlidePanel>
  );
}

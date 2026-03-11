import { SlidePanel } from "./SlidePanel";
import { privacyTerms } from "~/data/brand";

interface PolicyPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PolicyPanel({ isOpen, onClose }: PolicyPanelProps) {
  return (
    <SlidePanel isOpen={isOpen} onClose={onClose} title="Privacy & Terms">
      <div className="space-y-8 py-4">
        <section>
          <h3 className="text-xs uppercase tracking-[0.2em] text-white mb-3">
            Privacy Policy
          </h3>
          <p className="text-sm text-flow-300 leading-relaxed">
            {privacyTerms.privacy}
          </p>
        </section>

        <section>
          <h3 className="text-xs uppercase tracking-[0.2em] text-white mb-3">
            Terms of Service
          </h3>
          <p className="text-sm text-flow-300 leading-relaxed">
            {privacyTerms.terms}
          </p>
        </section>
      </div>
    </SlidePanel>
  );
}

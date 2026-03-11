import { SlidePanel } from "./SlidePanel";
import { shippingPolicy, refundPolicy } from "~/data/brand";

interface ShippingPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShippingPanel({ isOpen, onClose }: ShippingPanelProps) {
  return (
    <SlidePanel isOpen={isOpen} onClose={onClose} title="Shipping & Returns">
      <div className="space-y-8 py-4">
        <section>
          <h3 className="text-xs uppercase tracking-[0.2em] text-white mb-3">
            Shipping
          </h3>
          <p className="text-sm text-flow-300 leading-relaxed mb-3">
            All orders ship via {shippingPolicy.carrier} from {shippingPolicy.origin}.
          </p>
          <ul className="space-y-2 text-sm text-flow-300">
            <li className="flex justify-between">
              <span>CDMX</span>
              <span className="text-flow-400">{shippingPolicy.cdmx}</span>
            </li>
            <li className="flex justify-between">
              <span>National (Mexico)</span>
              <span className="text-flow-400">{shippingPolicy.national}</span>
            </li>
            <li className="flex justify-between">
              <span>International</span>
              <span className="text-flow-400">{shippingPolicy.international}</span>
            </li>
          </ul>
        </section>

        <section>
          <h3 className="text-xs uppercase tracking-[0.2em] text-white mb-3">
            Returns & Exchanges
          </h3>
          <ul className="space-y-2 text-sm text-flow-300">
            <li className="flex justify-between">
              <span>Refunds</span>
              <span className="text-flow-400">{refundPolicy.refundWindow}</span>
            </li>
            <li className="flex justify-between">
              <span>Exchanges</span>
              <span className="text-flow-400">{refundPolicy.exchangeWindow}</span>
            </li>
          </ul>
        </section>

        <section>
          <h3 className="text-xs uppercase tracking-[0.2em] text-white mb-3">
            Non-Returnable Conditions
          </h3>
          <ul className="space-y-1.5 text-sm text-flow-300">
            {refundPolicy.nonReturnable.map((condition) => (
              <li key={condition} className="flex items-start gap-2">
                <span className="text-flow-600 mt-1">—</span>
                <span>{condition}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </SlidePanel>
  );
}

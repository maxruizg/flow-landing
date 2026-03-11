import type { MetaFunction } from "@remix-run/node";
import { motion } from "framer-motion";
import { brand, shippingPolicy, refundPolicy, privacyTerms } from "~/data/brand";

export const meta: MetaFunction = () => [{ title: "FLOW Admin — Settings" }];

const inputClass =
  "w-full bg-flow-950 border border-flow-700 rounded-lg px-4 py-3 text-sm text-flow-100 placeholder:text-flow-500 focus:border-accent-500 focus:outline-none transition-colors";
const labelClass = "block text-xs text-flow-400 mb-1.5 uppercase tracking-wide";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-5 space-y-4">
      <h3 className="text-xs uppercase tracking-wide text-flow-500 font-medium border-b border-flow-800/30 pb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function AdminSettings() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-3xl"
    >
      <Section title="Store Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Store Name</label>
            <input className={inputClass} defaultValue={brand.name} />
          </div>
          <div>
            <label className={labelClass}>Founder</label>
            <input className={inputClass} defaultValue={brand.founder} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Origin</label>
          <input className={inputClass} defaultValue={brand.origin} />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea className={`${inputClass} resize-none`} rows={3} defaultValue={brand.description} />
        </div>
      </Section>

      <Section title="Shipping Policy">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Carrier</label>
            <input className={inputClass} defaultValue={shippingPolicy.carrier} />
          </div>
          <div>
            <label className={labelClass}>Origin</label>
            <input className={inputClass} defaultValue={shippingPolicy.origin} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>CDMX Delivery</label>
            <input className={inputClass} defaultValue={shippingPolicy.cdmx} />
          </div>
          <div>
            <label className={labelClass}>National Delivery</label>
            <input className={inputClass} defaultValue={shippingPolicy.national} />
          </div>
          <div>
            <label className={labelClass}>International</label>
            <input className={inputClass} defaultValue={shippingPolicy.international} />
          </div>
        </div>
      </Section>

      <Section title="Refund Policy">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Refund Window</label>
            <input className={inputClass} defaultValue={refundPolicy.refundWindow} />
          </div>
          <div>
            <label className={labelClass}>Exchange Window</label>
            <input className={inputClass} defaultValue={refundPolicy.exchangeWindow} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Non-Returnable Conditions</label>
          <textarea
            className={`${inputClass} resize-none`}
            rows={4}
            defaultValue={refundPolicy.nonReturnable.join("\n")}
          />
        </div>
      </Section>

      <Section title="Legal">
        <div>
          <label className={labelClass}>Privacy Policy</label>
          <textarea className={`${inputClass} resize-none`} rows={4} defaultValue={privacyTerms.privacy} />
        </div>
        <div>
          <label className={labelClass}>Terms of Service</label>
          <textarea className={`${inputClass} resize-none`} rows={4} defaultValue={privacyTerms.terms} />
        </div>
      </Section>

      <div className="flex justify-end">
        <button className="bg-white text-flow-black font-display font-semibold text-sm tracking-wide uppercase rounded-lg px-8 py-3 hover:bg-flow-200 transition-colors">
          Save Changes
        </button>
      </div>
    </motion.div>
  );
}

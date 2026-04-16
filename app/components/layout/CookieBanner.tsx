import { useEffect, useState } from "react";
import { useFetcher } from "@remix-run/react";
import { AnimatePresence, motion } from "framer-motion";
import type { CookieConsent } from "~/lib/cookies.server";

interface CookieBannerProps {
  initialConsent: CookieConsent | null;
}

const DEFAULT_PREFS: CookieConsent = {
  analytics: true,
  marketing: false,
  personalization: true,
};

const FULL: CookieConsent = { analytics: true, marketing: true, personalization: true };
const NONE: CookieConsent = { analytics: false, marketing: false, personalization: false };

export function CookieBanner({ initialConsent }: CookieBannerProps) {
  const [visible, setVisible] = useState(initialConsent === null);
  const [expanded, setExpanded] = useState(false);
  const [prefs, setPrefs] = useState<CookieConsent>(initialConsent ?? DEFAULT_PREFS);
  const fetcher = useFetcher<{ ok: true }>();

  // Auto-hide once the server confirms the save
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.ok) {
      setVisible(false);
    }
  }, [fetcher.state, fetcher.data]);

  const submit = (consent: CookieConsent) => {
    fetcher.submit(
      { consent: JSON.stringify(consent) },
      { method: "post", action: "/api/cookie-consent" },
    );
  };

  const submitting = fetcher.state !== "idle";

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-banner-title"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 32, transition: { duration: 0.2 } }}
          transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
          className="fixed inset-x-3 bottom-3 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-md z-[80] bg-flow-900/95 backdrop-blur-xl border border-flow-700/60 rounded-2xl shadow-2xl p-5 sm:p-6"
        >
          <div className="flex items-start gap-3 mb-3">
            <span className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-white/5 border border-flow-700/60 flex items-center justify-center">
              <svg className="w-4 h-4 text-flow-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-9-9c.34 2.21 2.41 3 4 3 0 2 1 3 3 3s3 1 3 3z" />
                <circle cx="8.5" cy="10.5" r="0.75" fill="currentColor" />
                <circle cx="14" cy="15" r="0.75" fill="currentColor" />
                <circle cx="11" cy="8" r="0.75" fill="currentColor" />
              </svg>
            </span>
            <div className="flex-1 min-w-0">
              <h2 id="cookie-banner-title" className="font-display text-sm font-semibold text-white uppercase tracking-wider">
                Cookies
              </h2>
              <p className="text-xs text-flow-400 leading-relaxed mt-1">
                We use cookies to keep your session, cart, and preferences. Pick what
                else you're comfortable with.
              </p>
            </div>
          </div>

          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="space-y-3 pt-2 pb-1 border-t border-flow-800/50 mt-2">
                <ConsentToggle
                  label="Analytics"
                  description="Aggregate traffic stats — no personal profiles."
                  checked={prefs.analytics}
                  onChange={(v) => setPrefs((p) => ({ ...p, analytics: v }))}
                />
                <ConsentToggle
                  label="Marketing"
                  description="Ads and retargeting across other sites."
                  checked={prefs.marketing}
                  onChange={(v) => setPrefs((p) => ({ ...p, marketing: v }))}
                />
                <ConsentToggle
                  label="Personalization"
                  description="Remember recently viewed items, sizes, and filters."
                  checked={prefs.personalization}
                  onChange={(v) => setPrefs((p) => ({ ...p, personalization: v }))}
                />
              </div>
            </motion.div>
          )}

          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => submit(NONE)}
                className="px-4 py-2.5 rounded-lg border border-flow-700 text-flow-300 text-xs font-medium uppercase tracking-wider hover:bg-flow-800 hover:text-white transition-colors disabled:opacity-50"
              >
                Reject All
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => submit(FULL)}
                className="px-4 py-2.5 rounded-lg bg-white text-flow-black text-xs font-semibold uppercase tracking-wider hover:bg-flow-100 transition-colors disabled:opacity-50"
              >
                Accept All
              </button>
            </div>
            {expanded ? (
              <button
                type="button"
                disabled={submitting}
                onClick={() => submit(prefs)}
                className="px-4 py-2.5 rounded-lg border border-flow-700 text-flow-200 text-xs font-medium uppercase tracking-wider hover:bg-flow-800 hover:text-white transition-colors disabled:opacity-50"
              >
                Save Preferences
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="px-4 py-2 text-flow-500 text-[11px] uppercase tracking-widest hover:text-flow-200 transition-colors"
              >
                Customize
              </button>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function ConsentToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <span
        className={
          "relative flex-shrink-0 w-9 h-5 rounded-full transition-colors mt-0.5 " +
          (checked ? "bg-white" : "bg-flow-700")
        }
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <span
          className={
            "absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform " +
            (checked ? "translate-x-4 bg-flow-black" : "translate-x-0 bg-flow-300")
          }
        />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-xs font-medium text-white group-hover:text-white">
          {label}
        </span>
        <span className="block text-[11px] text-flow-500 leading-snug mt-0.5">
          {description}
        </span>
      </span>
    </label>
  );
}

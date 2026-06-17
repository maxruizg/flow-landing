import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale } from "~/context/LocaleContext";
import { cn } from "~/lib/utils";

const HINT_KEY = "flow_locale_hint_dismissed";

const FLAG: Record<string, string> = { US: "🇺🇸", MX: "🇲🇽" };

interface LocaleSwitcherProps {
  /** Opens the full preferences slide-over ("More settings"). */
  onOpenSettings: () => void;
  /** Compact trigger (flag + chevron only) for tight mobile layouts. */
  compact?: boolean;
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-flow-500 mb-2 px-1">
        {label}
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={cn(
                "px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200",
                active
                  ? "bg-white/[0.06] border-flow-400 text-white"
                  : "bg-transparent border-flow-800 text-flow-400 hover:border-flow-600 hover:text-white"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function LocaleSwitcher({ onOpenSettings, compact = false }: LocaleSwitcherProps) {
  const { currency, setCurrency, language, setLanguage, country } = useLocale();
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // First-visit hint — gated on a localStorage flag, revealed after mount to
  // avoid a hydration mismatch (the server can't know the flag).
  useEffect(() => {
    try {
      if (!localStorage.getItem(HINT_KEY)) setShowHint(true);
    } catch {
      /* localStorage unavailable — skip the hint */
    }
  }, []);

  const dismissHint = () => {
    setShowHint(false);
    try {
      localStorage.setItem(HINT_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  // Close on outside click + Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    setOpen((v) => !v);
    if (showHint) dismissHint();
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        aria-label="Currency and language"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={toggle}
        className={cn(
          "flex items-center gap-1.5 rounded-full border border-flow-800 hover:border-flow-600 bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-200 text-flow-200",
          compact ? "px-2.5 py-1.5" : "px-3 py-1.5"
        )}
      >
        <span className="text-sm leading-none">{FLAG[country] ?? "🌐"}</span>
        {!compact && (
          <span className="text-[11px] font-semibold tracking-wide tabular-nums">
            {currency} · {language.toUpperCase()}
          </span>
        )}
        <svg
          className={cn(
            "w-3 h-3 text-flow-400 transition-transform duration-200",
            open && "rotate-180"
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* First-visit hint */}
      <AnimatePresence>
        {showHint && !open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="absolute top-full right-0 mt-2 z-[70] w-56"
          >
            <div className="relative rounded-xl border border-flow-700 bg-flow-950 shadow-xl px-3.5 py-3">
              <div className="absolute -top-1.5 right-5 w-3 h-3 rotate-45 bg-flow-950 border-l border-t border-flow-700" />
              <div className="flex items-start gap-2">
                <span className="text-sm leading-tight">💱</span>
                <p className="text-[11px] leading-relaxed text-flow-300 flex-1">
                  Shop in USD or MXN — change currency &amp; language here anytime.
                </p>
                <button
                  aria-label="Dismiss"
                  onClick={dismissHint}
                  className="text-flow-500 hover:text-white transition-colors -mt-0.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute top-full right-0 mt-2 z-[70] w-60 origin-top-right"
          >
            <div className="rounded-xl border border-flow-800 bg-flow-950 shadow-2xl p-4 space-y-4">
              <Segmented
                label="Currency"
                value={currency}
                options={[
                  { value: "MXN", label: "MXN" },
                  { value: "USD", label: "USD" },
                ]}
                onChange={setCurrency}
              />
              <Segmented
                label="Language"
                value={language}
                options={[
                  { value: "es", label: "Español" },
                  { value: "en", label: "English" },
                ]}
                onChange={setLanguage}
              />
              <button
                onClick={() => {
                  setOpen(false);
                  onOpenSettings();
                }}
                className="w-full text-left text-[11px] text-flow-400 hover:text-white transition-colors pt-1"
              >
                More settings →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

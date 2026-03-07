import { SlidePanel } from "./SlidePanel";
import { useLocale } from "~/context/LocaleContext";
import { cn } from "~/lib/utils";

interface LocalePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function OptionCard({
  active,
  onClick,
  label,
  detail,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  detail?: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-4 w-full px-4 py-3.5 rounded-xl border transition-all duration-300",
        active
          ? "bg-white/[0.06] border-flow-400"
          : "bg-transparent border-flow-800 hover:border-flow-600 hover:bg-white/[0.02]"
      )}
    >
      <span className="text-lg flex-shrink-0 w-7 text-center">{icon}</span>
      <span className="flex flex-col items-start gap-0.5 flex-1 min-w-0">
        <span
          className={cn(
            "text-sm font-medium transition-colors",
            active ? "text-white" : "text-flow-300 group-hover:text-white"
          )}
        >
          {label}
        </span>
        {detail && (
          <span className="text-[11px] text-flow-600">{detail}</span>
        )}
      </span>
      <span
        className={cn(
          "w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300",
          active
            ? "border-white bg-white"
            : "border-flow-600 group-hover:border-flow-400"
        )}
      >
        {active && (
          <svg
            className="w-2.5 h-2.5 text-flow-black"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        )}
      </span>
    </button>
  );
}

export function LocalePanel({ isOpen, onClose }: LocalePanelProps) {
  const { language, setLanguage, country, setCountry, currency, setCurrency } =
    useLocale();

  const summaryParts = [
    language === "en" ? "English" : "Español",
    country === "US" ? "US" : "MX",
    currency,
  ];

  return (
    <SlidePanel isOpen={isOpen} onClose={onClose} title="Preferences">
      {/* Current selection summary */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-flow-800/60 mb-8">
        <svg
          className="w-3.5 h-3.5 text-flow-500 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A8.966 8.966 0 013 12c0-1.777.515-3.435 1.404-4.832"
          />
        </svg>
        <span className="text-[11px] text-flow-400 tracking-wide">
          {summaryParts.join(" · ")}
        </span>
      </div>

      <div className="space-y-8">
        {/* Language */}
        <div>
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-flow-500 mb-3 px-1">
            Language
          </h3>
          <div className="space-y-2">
            <OptionCard
              active={language === "en"}
              onClick={() => setLanguage("en")}
              icon={<span className="text-base">EN</span>}
              label="English"
              detail="Interface language"
            />
            <OptionCard
              active={language === "es"}
              onClick={() => setLanguage("es")}
              icon={<span className="text-base">ES</span>}
              label="Español"
              detail="Idioma de la interfaz"
            />
          </div>
        </div>

        <div className="border-t border-flow-800/40" />

        {/* Country */}
        <div>
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-flow-500 mb-3 px-1">
            Country / Region
          </h3>
          <div className="space-y-2">
            <OptionCard
              active={country === "US"}
              onClick={() => setCountry("US")}
              icon="🇺🇸"
              label="United States"
              detail="Shipping & availability"
            />
            <OptionCard
              active={country === "MX"}
              onClick={() => setCountry("MX")}
              icon="🇲🇽"
              label="México"
              detail="Envío y disponibilidad"
            />
          </div>
        </div>

        <div className="border-t border-flow-800/40" />

        {/* Currency */}
        <div>
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-flow-500 mb-3 px-1">
            Currency
          </h3>
          <div className="space-y-2">
            <OptionCard
              active={currency === "USD"}
              onClick={() => setCurrency("USD")}
              icon="$"
              label="US Dollar"
              detail="USD"
            />
            <OptionCard
              active={currency === "MXN"}
              onClick={() => setCurrency("MXN")}
              icon="$"
              label="Peso Mexicano"
              detail="MXN"
            />
          </div>
        </div>
      </div>
    </SlidePanel>
  );
}

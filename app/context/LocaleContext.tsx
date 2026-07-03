import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";

type Currency = "USD" | "MXN";
type Language = "en" | "es";
type Country = "US" | "MX";

// Plain, client-readable locale cookies (mirror of LOCALE_COOKIE_NAMES /
// LOCALE_COOKIE_MAX_AGE in app/lib/cookies.server.ts — duplicated here so this
// client module never imports the server file). `resolveLocale` reads these on
// the next request to seed the provider.
const LOCALE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Write a locale preference cookie synchronously. Doing this client-side (rather
 * than via an async POST) means the value is already present on the very next
 * full-document request, so a hard navigation right after switching currency
 * reads the new value on the first try instead of racing a server round-trip.
 */
function writeLocaleCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${value}; Path=/; Max-Age=${LOCALE_MAX_AGE}; SameSite=Lax${secure}`;
}

interface LocaleContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  country: Country;
  setCountry: (c: Country) => void;
  /**
   * Format a price in the active currency. Returns `null` when currency is
   * MXN and no real MXN price exists — the server rejects MXN purchases for
   * variants without `price_mxn > 0`, so fabricating a converted price would
   * show customers a number they can never pay. Callers should render a
   * "Precio no disponible" fallback for `null`.
   */
  formatLocalPrice: (usdAmount: number, mxnAmount?: number) => string | null;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
  initialCurrency = "MXN",
  initialLanguage = "es",
  initialCountry = "MX",
}: {
  children: ReactNode;
  initialCurrency?: Currency;
  initialLanguage?: Language;
  initialCountry?: Country;
}) {
  const [currency, setCurrencyState] = useState<Currency>(initialCurrency);
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  const [country, setCountryState] = useState<Country>(initialCountry);

  // Update React state AND persist the choice to a plain cookie synchronously, so
  // the selection survives reloads and is available immediately on the next
  // navigation. See writeLocaleCookie above.
  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    writeLocaleCookie("flow_currency", c);
  }, []);
  const setLanguage = useCallback((l: Language) => {
    setLanguageState(l);
    writeLocaleCookie("flow_language", l);
  }, []);
  const setCountry = useCallback((c: Country) => {
    setCountryState(c);
    writeLocaleCookie("flow_country", c);
  }, []);

  const formatLocalPrice = useCallback(
    (usdAmount: number, mxnAmount?: number) => {
      if (currency === "MXN") {
        // No fabricated ×17 conversion: if the variant has no real MXN price
        // the server refuses the purchase, so signal "unavailable" instead of
        // inventing a number. (NaN from `undefined * qty` callers is falsy.)
        if (!(typeof mxnAmount === "number" && Number.isFinite(mxnAmount) && mxnAmount > 0)) {
          return null;
        }
        const amount = mxnAmount;
        return new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: "MXN",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount);
      }
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(usdAmount);
    },
    [currency]
  );

  return (
    <LocaleContext.Provider
      value={{
        currency,
        setCurrency,
        language,
        setLanguage,
        country,
        setCountry,
        formatLocalPrice,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

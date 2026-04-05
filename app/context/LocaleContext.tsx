import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";

type Currency = "USD" | "MXN";
type Language = "en" | "es";
type Country = "US" | "MX";

interface LocaleContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  country: Country;
  setCountry: (c: Country) => void;
  formatLocalPrice: (usdAmount: number, mxnAmount?: number) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("MXN");
  const [language, setLanguage] = useState<Language>("es");
  const [country, setCountry] = useState<Country>("MX");

  const formatLocalPrice = useCallback(
    (usdAmount: number, mxnAmount?: number) => {
      if (currency === "MXN") {
        const amount = mxnAmount && mxnAmount > 0 ? mxnAmount : Math.round(usdAmount * 17);
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

import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { useFetcher } from "@remix-run/react";

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

  // Persist each change to the signed, HttpOnly locale cookies via the
  // /api/locale resource route (the cookies can't be written from client JS).
  // This is why a manual currency pick survives reloads.
  const fetcher = useFetcher();
  const persist = useCallback(
    (patch: Partial<{ currency: Currency; language: Language; country: Country }>) => {
      fetcher.submit(patch, { method: "post", action: "/api/locale" });
    },
    [fetcher]
  );

  const setCurrency = useCallback(
    (c: Currency) => {
      setCurrencyState(c);
      persist({ currency: c });
    },
    [persist]
  );
  const setLanguage = useCallback(
    (l: Language) => {
      setLanguageState(l);
      persist({ language: l });
    },
    [persist]
  );
  const setCountry = useCallback(
    (c: Country) => {
      setCountryState(c);
      persist({ country: c });
    },
    [persist]
  );

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

import { useEffect } from "react";

interface GoogleAnalyticsProps {
  measurementId: string;
}

type GtagFn = (...args: unknown[]) => void;
type GAWindow = Window & {
  dataLayer?: unknown[];
  gtag?: GtagFn;
  __gaLoadedId?: string;
};

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const safeId = measurementId.replace(/[^\w-]/g, "");

  useEffect(() => {
    if (!safeId) return;
    const w = window as unknown as GAWindow;
    if (w.__gaLoadedId === safeId) return;
    w.__gaLoadedId = safeId;

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(safeId)}`;
    document.head.appendChild(script);

    w.dataLayer = w.dataLayer || [];
    const gtag: GtagFn = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments);
    };
    w.gtag = gtag;
    gtag("js", new Date());
    gtag("config", safeId, { anonymize_ip: true });
  }, [safeId]);

  return null;
}

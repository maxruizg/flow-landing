import { useEffect, useRef, useState } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
  useRouteLoaderData,
} from "@remix-run/react";
import type { ShouldRevalidateFunction } from "@remix-run/react";
import { json } from "@remix-run/node";
import type {
  HeadersFunction,
  LinksFunction,
  MetaFunction,
} from "@remix-run/node";
import { Analytics } from "@vercel/analytics/remix";
import { SpeedInsights } from "@vercel/speed-insights/remix";
import { getTrendingProducts, getActiveBanner } from "~/data/queries.server";
import { LocaleProvider } from "~/context/LocaleContext";
import { CartProvider } from "~/context/CartContext";
import { getFlashToast } from "~/lib/toast.server";
import {
  getConsent,
  resolveLocale,
  type CookieConsent,
  type Locale,
} from "~/lib/cookies.server";
import { CookieBanner } from "~/components/layout/CookieBanner";
import { GoogleAnalytics } from "~/components/analytics/GoogleAnalytics";
import { GoogleTagManager } from "~/components/analytics/GoogleTagManager";
import { MetaPixel } from "~/components/analytics/MetaPixel";
import {
  SITE_URL,
  ORG_NAME,
  ORG_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  organizationJsonLd,
  websiteJsonLd,
  serializeJsonLd,
} from "~/lib/seo";

import styles from "~/styles/global.css?url";

const ROOT_TITLE =
  "FLOW Urban Wear | Streetwear Mexicano Hecho en CDMX";

export const links: LinksFunction = () => [
  // Preload the latin subsets so the body text and hero heading don't FOIT.
  // The latin-ext files are still loaded lazily by global.css's @font-face
  // rules but are not on the critical path.
  {
    rel: "preload",
    as: "font",
    type: "font/woff2",
    href: "/fonts/inter-latin.woff2",
    crossOrigin: "anonymous",
  },
  {
    rel: "preload",
    as: "font",
    type: "font/woff2",
    href: "/fonts/space-grotesk-latin.woff2",
    crossOrigin: "anonymous",
  },
  // Favicons: Google requires a square icon, ≥48px, in a multiple of 48,
  // at a stable crawlable URL. /favicon.ico also covers legacy UA requests
  // that 404'd before (Google fell back to the default globe).
  { rel: "icon", href: "/favicon.ico", sizes: "32x32" },
  { rel: "icon", type: "image/png", sizes: "48x48", href: "/favicon-48.png" },
  { rel: "icon", type: "image/png", sizes: "96x96", href: "/favicon-96.png" },
  { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
  { rel: "manifest", href: "/site.webmanifest" },
  { rel: "stylesheet", href: styles },
];

export const meta: MetaFunction = () => [
  { title: ROOT_TITLE },
  { name: "description", content: ORG_DESCRIPTION },
  { property: "og:type", content: "website" },
  { property: "og:site_name", content: ORG_NAME },
  { property: "og:title", content: ROOT_TITLE },
  { property: "og:description", content: ORG_DESCRIPTION },
  { property: "og:image", content: DEFAULT_OG_IMAGE },
  { property: "og:url", content: SITE_URL },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:title", content: ROOT_TITLE },
  { name: "twitter:description", content: ORG_DESCRIPTION },
  { name: "twitter:image", content: DEFAULT_OG_IMAGE },
];

export async function loader({ request }: { request: Request }) {
  const [trendingProducts, banner, flash, consent, locale] = await Promise.all([
    getTrendingProducts(),
    getActiveBanner(),
    getFlashToast(request),
    getConsent(request),
    resolveLocale(request),
  ]);

  const responseInit = flash.commit
    ? { headers: { "Set-Cookie": flash.commit } }
    : undefined;

  return json(
    {
      trendingProducts,
      banner,
      flashToast: flash.toast,
      consent,
      locale,
      // Only PUBLIC values belong here — ENV is injected into window.ENV
      // (see EnvScript). Supabase URL/anon key were removed once the browser
      // stopped creating a Supabase client; checkout still reads
      // window.ENV.STRIPE_PUBLISHABLE_KEY.
      ENV: {
        STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || "",
        GA_MEASUREMENT_ID: process.env.GA_MEASUREMENT_ID || "",
        GTM_CONTAINER_ID: process.env.GTM_CONTAINER_ID || "",
        META_PIXEL_ID: process.env.META_PIXEL_ID || "",
      },
    },
    responseInit,
  );
}

/**
 * Skip the root loader on client-side navigations within the same path. The
 * data we return (trending, banner, ENV) is stable per session; without this
 * guard Single Fetch re-runs all loaders on every nav, which dominates TTFB.
 * Mutations and pathname changes still revalidate.
 */
export const shouldRevalidate: ShouldRevalidateFunction = ({
  currentUrl,
  nextUrl,
  formMethod,
  defaultShouldRevalidate,
}) => {
  if (formMethod) return defaultShouldRevalidate;
  if (currentUrl.pathname === nextUrl.pathname) return false;
  return defaultShouldRevalidate;
};

/**
 * Root cache policy: do not let upstream caches store the shell. Public
 * routes that *do* want edge caching set their own headers (Remix's default
 * is child-wins).
 */
export const headers: HeadersFunction = () => ({
  "Cache-Control": "private, max-age=0, must-revalidate",
});

type RootLoaderData = {
  consent: CookieConsent | null;
  locale: Locale;
  ENV: {
    STRIPE_PUBLISHABLE_KEY: string;
    GA_MEASUREMENT_ID: string;
    GTM_CONTAINER_ID: string;
    META_PIXEL_ID: string;
  };
};

export function Layout({ children }: { children: React.ReactNode }) {
  const rootData = useRouteLoaderData<RootLoaderData>("root");
  const consent = rootData?.consent ?? null;
  const gaId = rootData?.ENV?.GA_MEASUREMENT_ID ?? "";
  const gtmId = rootData?.ENV?.GTM_CONTAINER_ID ?? "";
  const metaPixelId = rootData?.ENV?.META_PIXEL_ID ?? "";
  // Spanish-first storefront; the loader resolves the visitor's language
  // (cookie choice, then geo default).
  const lang = rootData?.locale?.language ?? "es";

  return (
    <html lang={lang}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <JsonLdScripts />
      </head>
      <body className="font-body antialiased bg-flow-black text-flow-100">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-white focus:text-flow-black focus:rounded-lg focus:outline-none"
        >
          Skip to main content
        </a>
        {children}
        <Analytics />
        <SpeedInsights />
        <ConsentGatedAnalytics
          gaId={gaId}
          gtmId={gtmId}
          metaPixelId={metaPixelId}
          loaderConsent={consent}
        />
        <CookieBanner initialConsent={consent} />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { ENV, locale } = useLoaderData<typeof loader>();
  usePageViewBeacon();
  return (
    <LocaleProvider
      initialCurrency={locale.currency}
      initialLanguage={locale.language}
      initialCountry={locale.country}
    >
      <CartProvider>
        <EnvScript env={ENV} />
        <Outlet />
      </CartProvider>
    </LocaleProvider>
  );
}

/**
 * Reports public page views to /api/pageview off the critical render path.
 * Skips admin/api/internal paths and prefetched data requests.
 */
function usePageViewBeacon() {
  const { pathname } = useLocation();
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/build") ||
      pathname.startsWith("/assets") ||
      pathname.startsWith("/_")
    ) {
      return;
    }
    const url = `/api/pageview?path=${encodeURIComponent(pathname)}`;
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      navigator.sendBeacon(url);
    } else {
      void fetch(url, { method: "POST", keepalive: true }).catch(() => {});
    }

    // GA4 SPA pageview — skip the first mount: gtag('config', id) inside
    // <GoogleAnalytics /> fires the initial page_view when the consent-gated
    // tag mounts.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void })
      .gtag;
    if (typeof gtag === "function") {
      gtag("event", "page_view", {
        page_path: pathname,
        page_location: window.location.href,
        page_title: document.title,
      });
    }
  }, [pathname]);
}

/**
 * Client-only, consent-gated analytics (GA4 + GTM + Meta Pixel).
 *
 * Why nothing renders on the server: public routes are edge-cached
 * (`s-maxage`), while consent lives in an HttpOnly signed cookie read by the
 * root loader — so any consent-dependent markup in the SSR output would be
 * cross-served between users with different consent states. The server HTML
 * is therefore byte-identical regardless of consent, and analytics only
 * mount in the browser once THIS visitor's consent is confirmed.
 *
 * Consent sources, in order:
 *  1. After hydration, fetch /api/cookie-consent (per-request, never
 *     edge-cached) — the consent embedded in a cached document can belong to
 *     another visitor, and the HttpOnly cookie is unreadable from
 *     document.cookie by design.
 *  2. Live changes: saving the cookie banner POSTs via a fetcher, which makes
 *     Remix revalidate the root loader in this browser — that fresh value
 *     arrives through `loaderConsent` and wins from then on.
 */
function ConsentGatedAnalytics({
  gaId,
  gtmId,
  metaPixelId,
  loaderConsent,
}: {
  gaId: string;
  gtmId: string;
  metaPixelId: string;
  loaderConsent: CookieConsent | null;
}) {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  // The value embedded in the (possibly cached) initial document — untrusted.
  const hydratedConsent = useRef(loaderConsent);
  const revalidated = useRef(false);

  // Post-hydration loader revalidations are made with this browser's cookies
  // and are trustworthy. Reference inequality is enough: revalidation always
  // deserializes a fresh object.
  useEffect(() => {
    if (loaderConsent !== hydratedConsent.current) {
      revalidated.current = true;
      setConsent(loaderConsent);
    }
  }, [loaderConsent]);

  // Initial mount: ask the server for this browser's actual consent.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/cookie-consent")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { consent: CookieConsent | null } | null) => {
        if (cancelled || revalidated.current || !data) return;
        setConsent(data.consent);
      })
      .catch(() => {
        // No consent info — analytics simply stay off.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!consent) return null;

  return (
    <>
      {consent.analytics && gaId ? (
        <GoogleAnalytics measurementId={gaId} />
      ) : null}
      {consent.analytics && gtmId ? (
        <GoogleTagManager containerId={gtmId} />
      ) : null}
      {consent.marketing && metaPixelId ? (
        <MetaPixel pixelId={metaPixelId} />
      ) : null}
    </>
  );
}

function EnvScript({ env }: { env: Record<string, string> }) {
  const value = JSON.stringify(env);
  return <script dangerouslySetInnerHTML={{ __html: `window.ENV=${value}` }} />;
}

/**
 * Site-wide JSON-LD: Organization + WebSite. These feed Google's knowledge
 * panel (brand name, logo, founding date, social profile verification).
 *
 * XSS surface: the payload is built from server-owned constants in
 * app/lib/seo.ts and serialized through serializeJsonLd, which escapes `<`
 * (the only break-out vector inside a <script> body) along with U+2028 and
 * U+2029. This is the established safe pattern for inline JSON-LD shared by
 * Next.js, the React docs, and Google's structured-data guide.
 */
function JsonLdScripts() {
  const org = serializeJsonLd(organizationJsonLd());
  const site = serializeJsonLd(websiteJsonLd());
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: org }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: site }}
      />
    </>
  );
}

export function ErrorBoundary() {
  const isAdmin =
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="font-display text-4xl font-bold text-white mb-4">
          Oops!
        </h1>
        <p className="text-flow-400 mb-6">Something went wrong.</p>
        <a
          href={isAdmin ? "/admin/dashboard" : "/"}
          className="inline-flex items-center px-6 py-3 bg-white text-flow-black font-display font-semibold rounded-lg hover:bg-flow-200 transition-colors"
        >
          {isAdmin ? "Back to Dashboard" : "Back to Home"}
        </a>
      </div>
    </div>
  );
}

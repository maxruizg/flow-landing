import { useEffect, useRef } from "react";
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
import { getConsent, type CookieConsent } from "~/lib/cookies.server";
import { CookieBanner } from "~/components/layout/CookieBanner";
import { GoogleAnalytics } from "~/components/analytics/GoogleAnalytics";
import { GoogleTagManager } from "~/components/analytics/GoogleTagManager";
import { MetaPixel } from "~/components/analytics/MetaPixel";

import styles from "~/styles/global.css?url";

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
  { rel: "stylesheet", href: styles },
];

export const meta: MetaFunction = () => [
  { title: "FLOW Urban Wear | Ropa Streetwear Mexicana CDMX - Hecho en México" },
  {
    name: "description",
    content: "Ropa streetwear mexicana 100% hecha en CDMX. Less thinking, more flow.",
  },
  { name: "slogan", content: "Less thinking, more flow." },
  { property: "og:type", content: "website" },
  { property: "og:title", content: "FLOW Urban Wear | Ropa Streetwear Mexicana CDMX - Hecho en México" },
  {
    property: "og:description",
    content: "Ropa streetwear mexicana 100% hecha en CDMX. Less thinking, more flow.",
  },
];

export async function loader({ request }: { request: Request }) {
  const [trendingProducts, banner, flash, consent] = await Promise.all([
    getTrendingProducts(),
    getActiveBanner(),
    getFlashToast(request),
    getConsent(request),
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
      ENV: {
        SUPABASE_URL: process.env.SUPABASE_URL!,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
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
  ENV: {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
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

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
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
        {consent?.analytics && gaId && <GoogleAnalytics measurementId={gaId} />}
        {consent?.analytics && gtmId && <GoogleTagManager containerId={gtmId} />}
        {consent?.marketing && metaPixelId && <MetaPixel pixelId={metaPixelId} />}
        <CookieBanner initialConsent={consent} />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { ENV } = useLoaderData<typeof loader>();
  usePageViewBeacon();
  return (
    <LocaleProvider>
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

    // GA4 SPA pageview — skip the first mount, since gtag('config', id) in
    // /scripts/ga-init.js already fires the initial page_view.
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

function EnvScript({ env }: { env: Record<string, string> }) {
  const value = JSON.stringify(env);
  return <script dangerouslySetInnerHTML={{ __html: `window.ENV=${value}` }} />;
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

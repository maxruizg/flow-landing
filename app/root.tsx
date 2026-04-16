import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteLoaderData,
} from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LinksFunction, MetaFunction } from "@remix-run/node";
import { Analytics } from "@vercel/analytics/remix";
import { SpeedInsights } from "@vercel/speed-insights/remix";
import { getTrendingProducts, getActiveBanner } from "~/data/queries.server";
import { LocaleProvider } from "~/context/LocaleContext";
import { CartProvider } from "~/context/CartContext";
import { getFlashToast } from "~/lib/toast.server";
import { getConsent, type CookieConsent } from "~/lib/cookies.server";
import { CookieBanner } from "~/components/layout/CookieBanner";
import { GoogleAnalytics } from "~/components/analytics/GoogleAnalytics";
import { MetaPixel } from "~/components/analytics/MetaPixel";

import styles from "~/styles/global.css?url";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap",
  },
  { rel: "stylesheet", href: styles },
];

export const meta: MetaFunction = () => [
  { title: "FLOW URBAN WEAR — Less Thinking More Flow" },
  {
    name: "description",
    content:
      "FLOW URBAN WEAR. Streetwear born in Mexico City for those who move with intention. Self-expression, culture, and the freedom to just flow.",
  },
  { property: "og:type", content: "website" },
  { property: "og:title", content: "FLOW URBAN WEAR — Less Thinking More Flow" },
  {
    property: "og:description",
    content: "Streetwear born in Mexico City for those who move with intention.",
  },
];

export async function loader({ request }: { request: Request }) {
  const [trendingProducts, banner, flash, consent] = await Promise.all([
    getTrendingProducts(),
    getActiveBanner(),
    getFlashToast(request),
    getConsent(request),
  ]);
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
        META_PIXEL_ID: process.env.META_PIXEL_ID || "",
      },
    },
    flash.commit ? { headers: { "Set-Cookie": flash.commit } } : undefined,
  );
}

type RootLoaderData = {
  consent: CookieConsent | null;
  ENV: {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    STRIPE_PUBLISHABLE_KEY: string;
    GA_MEASUREMENT_ID: string;
    META_PIXEL_ID: string;
  };
};

export function Layout({ children }: { children: React.ReactNode }) {
  const rootData = useRouteLoaderData<RootLoaderData>("root");
  const consent = rootData?.consent ?? null;
  const gaId = rootData?.ENV?.GA_MEASUREMENT_ID ?? "";
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
  return (
    <LocaleProvider>
      <CartProvider>
        <EnvScript env={ENV} />
        <Outlet />
      </CartProvider>
    </LocaleProvider>
  );
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

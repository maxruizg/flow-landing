import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction, MetaFunction } from "@remix-run/node";

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

export function Layout({ children }: { children: React.ReactNode }) {
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
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="font-display text-4xl font-bold text-white mb-4">
          Oops!
        </h1>
        <p className="text-flow-400 mb-6">Something went wrong.</p>
        <a
          href="/"
          className="inline-flex items-center px-6 py-3 bg-white text-flow-black font-display font-semibold rounded-lg hover:bg-flow-200 transition-colors"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}

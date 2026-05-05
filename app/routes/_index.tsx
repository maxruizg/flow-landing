import { lazy, Suspense } from "react";
import { json } from "@remix-run/node";
import type { HeadersFunction, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Navbar } from "~/components/layout/Navbar";
import { Footer } from "~/components/layout/Footer";
import { Hero } from "~/components/home/Hero";
import {
  DrawerRevealContainer,
  DrawerRevealSection,
} from "~/components/ui/DrawerReveal";
import { getHomePageData } from "~/data/queries.server";
import { optimizedImageUrl, buildSrcSet } from "~/lib/image";

// Below-the-fold sections — split out of the initial JS bundle. Each section
// imports framer-motion; loading them lazily cuts ~50–80 KB of gzipped JS off
// the home route's first paint.
const NewCollection = lazy(() =>
  import("~/components/home/NewCollection").then((m) => ({ default: m.NewCollection })),
);
const DailyFlow = lazy(() =>
  import("~/components/home/DailyFlow").then((m) => ({ default: m.DailyFlow })),
);
const BestSellers = lazy(() =>
  import("~/components/home/BestSellers").then((m) => ({ default: m.BestSellers })),
);
const Manifesto = lazy(() =>
  import("~/components/home/Manifesto").then((m) => ({ default: m.Manifesto })),
);
const Newsletter = lazy(() =>
  import("~/components/home/Newsletter").then((m) => ({ default: m.Newsletter })),
);

const SectionFallback = () => <div className="h-screen" aria-hidden />;

const HERO_WIDTHS = [960, 1280, 1920];
const HERO_SIZES = "100vw";

export async function loader() {
  const data = await getHomePageData();
  return json(data);
}

/**
 * Emit a high-priority preload hint for the hero LCP image as soon as the
 * HTML reaches the browser. Without this, the browser only discovers the
 * image after parsing the React tree, costing ~600 ms LCP on cold loads.
 */
export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const heroSrc = data?.collections?.[0]?.image;
  if (!heroSrc) return [];
  const imageSrcSet = buildSrcSet(heroSrc, HERO_WIDTHS);
  return [
    {
      tagName: "link",
      rel: "preload",
      as: "image",
      href: optimizedImageUrl(heroSrc, HERO_WIDTHS[HERO_WIDTHS.length - 1]),
      imageSrcSet,
      imageSizes: imageSrcSet ? HERO_SIZES : undefined,
      fetchpriority: "high",
    },
  ];
};

/**
 * Edge-cache the home doc for 5 min, serve stale up to a day while
 * revalidating in the background. Catalog updates land in <5 min and
 * Vercel honors stale-while-revalidate at the edge.
 */
export const headers: HeadersFunction = () => ({
  "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
});

export default function Index() {
  const { collections, bestSellers, dailyFlowImages, newArrivals } =
    useLoaderData<typeof loader>();

  return (
    <div id="main-content">
      <Navbar />

      {/* Drawer reveal sections */}
      <DrawerRevealContainer>
        <DrawerRevealSection index={0} total={3}>
          <Hero collection={collections[0]} />
        </DrawerRevealSection>
        <DrawerRevealSection index={1} total={3}>
          <Suspense fallback={<SectionFallback />}>
            <NewCollection products={newArrivals} />
          </Suspense>
        </DrawerRevealSection>
        <DrawerRevealSection index={2} total={3}>
          <Suspense fallback={<SectionFallback />}>
            <DailyFlow images={dailyFlowImages} />
          </Suspense>
        </DrawerRevealSection>
      </DrawerRevealContainer>

      {/* Normal scroll sections */}
      <Suspense fallback={<SectionFallback />}>
        <BestSellers products={bestSellers} />
      </Suspense>
      <Suspense fallback={<div className="h-64" aria-hidden />}>
        <Manifesto />
      </Suspense>
      <Suspense fallback={<div className="h-64" aria-hidden />}>
        <Newsletter />
      </Suspense>
      <Footer />
    </div>
  );
}

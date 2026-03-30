import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Navbar } from "~/components/layout/Navbar";
import { Footer } from "~/components/layout/Footer";
import { Hero } from "~/components/home/Hero";
import { NewCollection } from "~/components/home/NewCollection";
import { DailyFlow } from "~/components/home/DailyFlow";
import { BestSellers } from "~/components/home/BestSellers";
import { Manifesto } from "~/components/home/Manifesto";
import { Newsletter } from "~/components/home/Newsletter";
import {
  DrawerRevealContainer,
  DrawerRevealSection,
} from "~/components/ui/DrawerReveal";
import {
  getCollections,
  getBestSellers,
  getDailyFlowImages,
  getNewArrivals,
} from "~/data/queries.server";

export async function loader() {
  const [collections, bestSellers, dailyFlowImages, newArrivals] =
    await Promise.all([
      getCollections(),
      getBestSellers(),
      getDailyFlowImages(),
      getNewArrivals(),
    ]);
  return json({ collections, bestSellers, dailyFlowImages, newArrivals });
}

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
          <NewCollection products={newArrivals} />
        </DrawerRevealSection>
        <DrawerRevealSection index={2} total={3}>
          <DailyFlow images={dailyFlowImages} />
        </DrawerRevealSection>
      </DrawerRevealContainer>

      {/* Normal scroll sections */}
      <BestSellers products={bestSellers} />
      <Manifesto />
      <Newsletter />
      <Footer />
    </div>
  );
}

import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Navbar } from "~/components/layout/Navbar";
import { Footer } from "~/components/layout/Footer";
import { Hero } from "~/components/home/Hero";
import { NewCollection } from "~/components/home/NewCollection";
import { Editorial } from "~/components/home/Editorial";
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
  getEditorialImages,
  getNewArrivals,
} from "~/data/queries.server";

export async function loader() {
  const [collections, bestSellers, editorialImages, newArrivals] =
    await Promise.all([
      getCollections(),
      getBestSellers(),
      getEditorialImages(),
      getNewArrivals(),
    ]);
  return json({ collections, bestSellers, editorialImages, newArrivals });
}

export default function Index() {
  const { collections, bestSellers, editorialImages, newArrivals } =
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
          <Editorial images={editorialImages} />
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

import { LocaleProvider } from "~/context/LocaleContext";
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
  collections,
  bestSellers,
  editorialImages,
  newArrivals,
} from "~/data/mock";

export default function Index() {
  return (
    <LocaleProvider>
    <div id="main-content">
      <Navbar />

      {/* Drawer reveal sections */}
      <DrawerRevealContainer>
        <DrawerRevealSection index={0} total={3}>
          <Hero collection={collections[0]} />
        </DrawerRevealSection>
        <DrawerRevealSection index={1} total={3}>
          <NewCollection products={[...newArrivals, ...bestSellers.slice(0, 4)]} />
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
    </LocaleProvider>
  );
}

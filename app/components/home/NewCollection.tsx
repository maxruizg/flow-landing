import { Container } from "~/components/ui/Container";
import { AnimatedText } from "~/components/ui/AnimatedText";
import { ProductCard } from "~/components/product/ProductCard";
import type { Product } from "~/data/mock";

interface NewCollectionProps {
  products: Product[];
}

export function NewCollection({ products }: NewCollectionProps) {
  return (
    <section id="new-collection" className="bg-flow-100 text-flow-black py-20 md:py-28 h-full flex items-center rounded-t-2xl">
      <Container>
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-flow-500 mb-2 block">
              Latest Drop
            </span>
            <AnimatedText
              text="New Collection"
              as="h2"
              className="font-display text-4xl md:text-5xl font-bold tracking-tight text-flow-black"
            />
          </div>
          <a
            href="/showroom"
            className="link-underline text-xs uppercase tracking-[0.2em] text-flow-600 hover:text-flow-black transition-colors hidden md:block"
          >
            View All
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {products.map((product, i) => (
            <div
              key={product.id}
              className={i >= 4 ? "hidden sm:block" : undefined}
            >
              <ProductCard product={product} index={i} variant="light" />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

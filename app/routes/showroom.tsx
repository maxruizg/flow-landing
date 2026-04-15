import { json } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { useMemo, useCallback } from "react";
import { Navbar } from "~/components/layout/Navbar";
import { Footer } from "~/components/layout/Footer";
import { Newsletter } from "~/components/home/Newsletter";
import { ShowroomHero } from "~/components/showroom/ShowroomHero";
import { ShowroomFilters } from "~/components/showroom/ShowroomFilters";
import { ShowroomGrid } from "~/components/showroom/ShowroomGrid";
import { expandToVariantCards } from "~/lib/variant-cards";
import { getAllProducts } from "~/data/queries.server";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "Showroom — FLOW URBAN WEAR" },
    { name: "description", content: "Explore the full FLOW Urban Wear collection. 36 pieces made in Mexico, curated for those who move with intention." },
  ];
};

export async function loader() {
  const allProducts = await getAllProducts();
  return json({ allProducts });
}

export default function Showroom() {
  const { allProducts } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeCategory = searchParams.get("category") || "All";
  const activeGender = searchParams.get("gender") || "All";
  const showNewOnly = searchParams.get("new") === "true";
  const sortBy = searchParams.get("sort") || "featured";

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(updates)) {
          if (value === null || value === "") {
            next.delete(key);
          } else {
            next.set(key, value);
          }
        }
        return next;
      }, { preventScrollReset: true });
    },
    [setSearchParams]
  );

  const onCategoryChange = useCallback(
    (cat: string) => updateParams({ category: cat === "All" ? null : cat }),
    [updateParams]
  );

  const onGenderChange = useCallback(
    (g: string) => updateParams({ gender: g === "All" ? null : g.toLowerCase() }),
    [updateParams]
  );

  const onNewOnlyChange = useCallback(
    (val: boolean) => updateParams({ new: val ? "true" : null }),
    [updateParams]
  );

  const onSortChange = useCallback(
    (sort: string) => updateParams({ sort: sort === "featured" ? null : sort }),
    [updateParams]
  );

  const onClearAll = useCallback(
    () =>
      setSearchParams(new URLSearchParams(), {
        preventScrollReset: true,
      }),
    [setSearchParams]
  );

  const filteredCards = useMemo(() => {
    let products = allProducts;

    if (activeCategory !== "All") {
      products = products.filter((p) => p.category === activeCategory);
    }

    if (activeGender !== "All") {
      const g = activeGender.toLowerCase();
      products = products.filter((p) => p.gender === g || p.gender === "unisex");
    }

    let cards = expandToVariantCards(products);

    if (showNewOnly) {
      cards = cards.filter((c) => c.variant.isNew);
    }

    switch (sortBy) {
      case "price-asc":
        cards = [...cards].sort((a, b) => a.variant.price - b.variant.price);
        break;
      case "price-desc":
        cards = [...cards].sort((a, b) => b.variant.price - a.variant.price);
        break;
      case "newest":
        cards = [...cards].sort(
          (a, b) => (b.variant.isNew ? 1 : 0) - (a.variant.isNew ? 1 : 0),
        );
        break;
      default:
        break;
    }

    return cards;
  }, [allProducts, activeCategory, activeGender, showNewOnly, sortBy]);

  // Normalize gender display (URL is lowercase, pills are capitalized)
  const displayGender =
    activeGender === "All"
      ? "All"
      : activeGender.charAt(0).toUpperCase() + activeGender.slice(1);

  return (
      <div id="main-content">
        <Navbar />
        <ShowroomHero />
        <ShowroomFilters
          activeCategory={activeCategory}
          activeGender={displayGender}
          showNewOnly={showNewOnly}
          sortBy={sortBy}
          productCount={filteredCards.length}
          onCategoryChange={onCategoryChange}
          onGenderChange={onGenderChange}
          onNewOnlyChange={onNewOnlyChange}
          onSortChange={onSortChange}
          onClearAll={onClearAll}
        />
        <ShowroomGrid
          cards={filteredCards}
          onClearFilters={onClearAll}
        />
        <Newsletter />
        <Footer />
      </div>
  );
}

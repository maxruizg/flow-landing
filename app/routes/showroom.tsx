import { json } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { lazy, Suspense, useMemo, useCallback } from "react";
import { Navbar } from "~/components/layout/Navbar";
import { Footer } from "~/components/layout/Footer";
import { ShowroomHero } from "~/components/showroom/ShowroomHero";
import { ShowroomFilters } from "~/components/showroom/ShowroomFilters";
import { ShowroomGrid } from "~/components/showroom/ShowroomGrid";
import { expandToVariantCards } from "~/lib/variant-cards";
import { getAllProducts, getEmailSettings } from "~/data/queries.server";
import { optimizedImageUrl, buildSrcSet } from "~/lib/image";
import { SITE_URL, DEFAULT_OG_IMAGE } from "~/lib/seo";
import type { HeadersFunction, MetaFunction } from "@remix-run/node";

// Below-the-fold — lazy-loaded with the same pattern as _index.tsx so the
// framer-motion-heavy Newsletter chunk stays out of the initial bundle (a
// static import here would also defeat _index's dynamic import of it).
const Newsletter = lazy(() =>
  import("~/components/home/Newsletter").then((m) => ({ default: m.Newsletter })),
);

const GRID_WIDTHS = [320, 480, 640];
const PRELOAD_COUNT = 4;
const SHOWROOM_URL = `${SITE_URL}/showroom`;
const SHOWROOM_TITLE = "Showroom — FLOW Urban Wear";
const SHOWROOM_DESC =
  "Explora la colección completa de FLOW Urban Wear: streetwear hecho en México, curado para quienes se mueven con intención.";

// Tag identifiers we redefine for this route — filter them out of the parent
// meta before re-adding so the head doesn't end up with duplicates.
const SHOWROOM_OVERRIDE_NAMES = new Set(["description", "twitter:title", "twitter:description"]);
const SHOWROOM_OVERRIDE_PROPS = new Set([
  "og:title",
  "og:description",
  "og:url",
  "og:image",
]);

export const meta: MetaFunction<typeof loader> = ({ data, matches }) => {
  const parentMeta = matches.flatMap((m) => m.meta ?? []);
  const filtered = parentMeta.filter((tag) => {
    const t = tag as { title?: string; name?: string; property?: string };
    if (t.title !== undefined) return false; // overridden below
    if (t.name && SHOWROOM_OVERRIDE_NAMES.has(t.name)) return false;
    if (t.property && SHOWROOM_OVERRIDE_PROPS.has(t.property)) return false;
    return true;
  });

  const tags: ReturnType<MetaFunction> = [
    ...filtered,
    { title: SHOWROOM_TITLE },
    { name: "description", content: SHOWROOM_DESC },
    { tagName: "link", rel: "canonical", href: SHOWROOM_URL },
    { property: "og:title", content: SHOWROOM_TITLE },
    { property: "og:description", content: SHOWROOM_DESC },
    { property: "og:url", content: SHOWROOM_URL },
    { property: "og:image", content: DEFAULT_OG_IMAGE },
    { name: "twitter:title", content: SHOWROOM_TITLE },
    { name: "twitter:description", content: SHOWROOM_DESC },
  ];

  // Preload the first N above-the-fold grid images so the LCP candidate
  // is in flight before React mounts.
  const cards = data?.allProducts
    ? expandToVariantCards(data.allProducts).slice(0, PRELOAD_COUNT)
    : [];
  for (const card of cards) {
    const src = card.variant.image;
    if (!src) continue;
    const imageSrcSet = buildSrcSet(src, GRID_WIDTHS);
    tags.push({
      tagName: "link",
      rel: "preload",
      as: "image",
      href: optimizedImageUrl(src, GRID_WIDTHS[GRID_WIDTHS.length - 1]),
      imageSrcSet,
      imageSizes: imageSrcSet
        ? "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
        : undefined,
    });
  }

  return tags;
};

export async function loader() {
  const [allProducts, heroSettings] = await Promise.all([
    getAllProducts(),
    getEmailSettings("showroom_hero"),
  ]);
  return json({ allProducts, shopHeroImage: heroSettings.image || "" });
}

export const headers: HeadersFunction = () => ({
  "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
});

export default function Showroom() {
  const { allProducts, shopHeroImage } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeCategory = searchParams.get("category") || "All";
  const activeGender = searchParams.get("gender") || "All";
  const sortBy = searchParams.get("sort") || "featured";
  const query = (searchParams.get("q") || "").trim();

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

  const onSortChange = useCallback(
    (sort: string) => updateParams({ sort: sort === "featured" ? null : sort }),
    [updateParams]
  );

  const onClearSearch = useCallback(
    () => updateParams({ q: null }),
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

    if (query) {
      const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
      products = products.filter((p) => {
        const haystack = [
          p.name,
          p.category,
          p.gender,
          p.material,
          p.brand,
          p.color,
          p.tags.join(" "),
          p.variants.map((v) => v.colorName).join(" "),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return terms.every((term) => haystack.includes(term));
      });
    }

    let cards = expandToVariantCards(products);

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
  }, [allProducts, activeCategory, activeGender, sortBy, query]);

  // Normalize gender display (URL is lowercase, pills are capitalized)
  const displayGender =
    activeGender === "All"
      ? "All"
      : activeGender.charAt(0).toUpperCase() + activeGender.slice(1);

  return (
      <div id="main-content">
        <Navbar />
        <ShowroomHero
          heroImage={shopHeroImage || undefined}
          pieceCount={allProducts.reduce(
            (sum, p) => sum + p.variants.filter((v) => v.status === "active").length,
            0,
          )}
        />
        <ShowroomFilters
          activeCategory={activeCategory}
          activeGender={displayGender}
          sortBy={sortBy}
          searchQuery={query}
          productCount={filteredCards.length}
          onCategoryChange={onCategoryChange}
          onGenderChange={onGenderChange}
          onSortChange={onSortChange}
          onClearSearch={onClearSearch}
          onClearAll={onClearAll}
        />
        <ShowroomGrid
          cards={filteredCards}
          onClearFilters={onClearAll}
        />
        <Suspense fallback={<div className="h-96" aria-hidden />}>
          <Newsletter />
        </Suspense>
        <Footer />
      </div>
  );
}

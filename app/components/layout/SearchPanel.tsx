import { useRef, useEffect, useState } from "react";
import { useRouteLoaderData, useNavigate, Link } from "@remix-run/react";
import { SlidePanel } from "./SlidePanel";
import { useLocale } from "~/context/LocaleContext";
import type { Product } from "~/lib/types";
import { OptimizedImage } from "~/components/ui/OptimizedImage";

const popularSearches = ["Hoodie", "Tee", "Crop Top", "Tote Bag", "Socks"];

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchPanel({ isOpen, onClose }: SearchPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { formatLocalPrice } = useLocale();
  const rootData = useRouteLoaderData("root") as { trendingProducts?: Product[] } | undefined;
  const trendingProducts = rootData?.trendingProducts || [];
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const goToSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    navigate(`/showroom?q=${encodeURIComponent(trimmed)}`);
    onClose();
  };

  return (
    <SlidePanel isOpen={isOpen} onClose={onClose} title="Search">
      <form
        className="relative"
        onSubmit={(e) => {
          e.preventDefault();
          goToSearch(query);
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          enterKeyHint="search"
          placeholder="Search products..."
          className="w-full bg-flow-900 border border-flow-700 rounded-none px-4 py-3 text-sm text-white placeholder:text-flow-500 focus:outline-none focus:border-flow-400 transition-colors"
        />
        <button
          type="submit"
          aria-label="Search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-flow-500 hover:text-white transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </button>
      </form>

      <div className="mt-8">
        <h3 className="text-[10px] uppercase tracking-[0.2em] text-flow-500 mb-4">
          Popular Searches
        </h3>
        <div className="flex flex-wrap gap-2">
          {popularSearches.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => goToSearch(term)}
              className="px-3 py-1.5 text-xs text-flow-300 border border-flow-700 hover:border-flow-400 hover:text-white cursor-pointer transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-[10px] uppercase tracking-[0.2em] text-flow-500 mb-4">
          Trending
        </h3>
        <div className="space-y-4">
          {trendingProducts.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.slug}`}
              onClick={onClose}
              className="flex items-center gap-4 group"
            >
              <div className="w-16 h-16 bg-flow-900 overflow-hidden flex-shrink-0">
                <OptimizedImage
                  src={product.image}
                  alt={product.name}
                  widths={[160, 320]}
                  sizes="64px"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div>
                <p className="text-sm text-white group-hover:text-flow-200 transition-colors">
                  {product.name}
                </p>
                <p className="text-xs text-flow-500 mt-0.5">
                  {formatLocalPrice(product.price, product.priceMxn)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </SlidePanel>
  );
}

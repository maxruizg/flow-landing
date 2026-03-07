import { useRef, useEffect } from "react";
import { SlidePanel } from "./SlidePanel";
import { bestSellers } from "~/data/mock";
import { useLocale } from "~/context/LocaleContext";

const popularSearches = ["Oversized Tee", "Cargo Pants", "Bomber Jacket", "New Arrivals"];
const trendingProducts = bestSellers.slice(0, 3);

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchPanel({ isOpen, onClose }: SearchPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { formatLocalPrice } = useLocale();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  return (
    <SlidePanel isOpen={isOpen} onClose={onClose} title="Search">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search products..."
          className="w-full bg-flow-900 border border-flow-700 rounded-none px-4 py-3 text-sm text-white placeholder:text-flow-500 focus:outline-none focus:border-flow-400 transition-colors"
        />
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-flow-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </div>

      <div className="mt-8">
        <h3 className="text-[10px] uppercase tracking-[0.2em] text-flow-500 mb-4">
          Popular Searches
        </h3>
        <div className="flex flex-wrap gap-2">
          {popularSearches.map((term) => (
            <span
              key={term}
              className="px-3 py-1.5 text-xs text-flow-300 border border-flow-700 hover:border-flow-400 hover:text-white cursor-pointer transition-colors"
            >
              {term}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-[10px] uppercase tracking-[0.2em] text-flow-500 mb-4">
          Trending
        </h3>
        <div className="space-y-4">
          {trendingProducts.map((product) => (
            <div key={product.id} className="flex items-center gap-4 group cursor-pointer">
              <div className="w-16 h-16 bg-flow-900 overflow-hidden flex-shrink-0">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div>
                <p className="text-sm text-white group-hover:text-flow-200 transition-colors">
                  {product.name}
                </p>
                <p className="text-xs text-flow-500 mt-0.5">
                  {formatLocalPrice(product.price)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SlidePanel>
  );
}

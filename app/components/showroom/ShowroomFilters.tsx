import { motion } from "framer-motion";
import { cn } from "~/lib/utils";

const categories = ["All", "Tops", "Bottoms", "Accessories"] as const;
const genders = ["All", "Men", "Women", "Unisex"] as const;
const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
  { value: "newest", label: "Newest" },
] as const;

interface ShowroomFiltersProps {
  activeCategory: string;
  activeGender: string;
  showNewOnly: boolean;
  sortBy: string;
  productCount: number;
  onCategoryChange: (category: string) => void;
  onGenderChange: (gender: string) => void;
  onNewOnlyChange: (value: boolean) => void;
  onSortChange: (sort: string) => void;
  onClearAll: () => void;
}

export function ShowroomFilters({
  activeCategory,
  activeGender,
  showNewOnly,
  sortBy,
  productCount,
  onCategoryChange,
  onGenderChange,
  onNewOnlyChange,
  onSortChange,
  onClearAll,
}: ShowroomFiltersProps) {
  const hasActiveFilters =
    activeCategory !== "All" || activeGender !== "All" || showNewOnly;

  return (
    <div className="sticky top-16 md:top-20 z-30 bg-flow-black/90 backdrop-blur-lg border-b border-flow-800/50">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
        {/* Filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {categories.map((cat) => (
            <FilterPill
              key={cat}
              label={cat}
              active={activeCategory === cat}
              onClick={() => onCategoryChange(cat)}
            />
          ))}

          <div className="w-px h-4 bg-flow-700 flex-shrink-0" />

          {genders.map((g) => (
            <FilterPill
              key={g}
              label={g}
              active={activeGender === g}
              onClick={() => onGenderChange(g)}
            />
          ))}

          <div className="w-px h-4 bg-flow-700 flex-shrink-0" />

          <FilterPill
            label="New Only"
            active={showNewOnly}
            onClick={() => onNewOnlyChange(!showNewOnly)}
          />
        </div>

        {/* Sort + count row */}
        <div className="flex items-center justify-between mt-3">
          <p
            className="text-xs text-flow-500"
            aria-live="polite"
          >
            {productCount} {productCount === 1 ? "piece" : "pieces"}
          </p>

          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-transparent text-xs text-flow-400 border border-flow-800 rounded-full px-3 py-1.5 focus:outline-none focus:border-flow-500 appearance-none cursor-pointer"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-flow-900">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Active filter tags */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {activeCategory !== "All" && (
              <FilterTag
                label={activeCategory}
                onRemove={() => onCategoryChange("All")}
              />
            )}
            {activeGender !== "All" && (
              <FilterTag
                label={activeGender}
                onRemove={() => onGenderChange("All")}
              />
            )}
            {showNewOnly && (
              <FilterTag
                label="New Only"
                onRemove={() => onNewOnlyChange(false)}
              />
            )}
            <button
              type="button"
              onClick={onClearAll}
              className="text-[10px] uppercase tracking-[0.15em] text-flow-500 hover:text-white transition-colors ml-1"
            >
              Clear All
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "rounded-full px-4 py-2 text-xs uppercase tracking-[0.15em] whitespace-nowrap flex-shrink-0 transition-colors duration-200",
        active
          ? "bg-white text-flow-black"
          : "bg-flow-900 text-flow-400 border border-flow-800 hover:border-flow-600"
      )}
    >
      {label}
    </motion.button>
  );
}

function FilterTag({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-flow-900 border border-flow-700 px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-flow-300">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="hover:text-white transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}

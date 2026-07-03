import { useMemo, useState } from "react";
import { Link } from "@remix-run/react";
import { cn } from "~/lib/utils";
import { useLocale } from "~/context/LocaleContext";
import { QuickAdd } from "./QuickAdd";
import type { Product, ProductVariant } from "~/lib/types";
import { OptimizedImage } from "~/components/ui/OptimizedImage";
import { colorSwatch } from "~/lib/color-map";

interface ProductCardProps {
  product: Product;
  index?: number;
  variant?: "light" | "dark";
  initialVariant?: ProductVariant;
}

export function ProductCard({ product, index = 0, variant = "dark", initialVariant }: ProductCardProps) {
  const { formatLocalPrice } = useLocale();

  const activeVariants = useMemo<ProductVariant[]>(
    () =>
      product.variants
        .filter((v) => v.status === "active")
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [product.variants],
  );

  const seedVariant =
    initialVariant ??
    activeVariants.find((v) => v.id === product.defaultVariantId) ??
    activeVariants[0];

  const [selected, setSelected] = useState<ProductVariant | undefined>(seedVariant);
  const [hovered, setHovered] = useState(false);

  const view = selected ?? seedVariant;
  if (!view) return null;

  const linkTo =
    view.id === product.defaultVariantId
      ? `/product/${product.slug}`
      : `/product/${product.slug}?variant=${view.id}`;

  // CSS-only fade-in: the previous framer-motion `whileInView` registered
  // one IntersectionObserver per card, which became measurable jank on the
  // showroom (~100 cards). The fade now runs on mount via animate-fade-in-up
  // with a stagger via inline animation-delay.
  const cardStyle =
    index > 0
      ? { animationDelay: `${Math.min(index, 12) * 0.05}s` }
      : undefined;

  return (
    <div
      className="group relative animate-fade-in-up opacity-0"
      style={cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link to={linkTo} prefetch="intent">
        <div className="relative aspect-[3/4] overflow-hidden bg-flow-900 mb-3 rounded-2xl">
          <OptimizedImage
            src={view.image}
            alt={`${product.name} ${view.colorName}`}
            widths={[320, 480, 640]}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
              hovered && view.imageHover ? "opacity-0" : "opacity-100",
            )}
          />
          {view.imageHover && (
            <OptimizedImage
              src={view.imageHover}
              alt={`${product.name} ${view.colorName} alternate view`}
              widths={[320, 480, 640]}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className={cn(
                "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
                hovered ? "opacity-100" : "opacity-0",
              )}
            />
          )}

          {view.badge && (
            <span
              className={cn(
                "absolute top-3 left-3 text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 font-medium rounded-full",
                view.badge === "New"
                  ? "bg-white text-flow-black"
                  : view.badge === "Low Stock"
                    ? "bg-red-600 text-white"
                    : "bg-flow-black text-white border border-flow-700",
              )}
            >
              {view.badge}
            </span>
          )}

          <QuickAdd
            sizes={product.sizes}
            visible={hovered}
            productId={product.id}
            productSlug={product.slug}
            productName={product.name}
            productImage={view.image}
            productPrice={view.price}
            productPriceMxn={view.priceMxn}
            variantId={view.id}
            variantSlug={view.slug}
            colorName={view.colorName}
            sizeStock={view.sizeStock}
          />
        </div>

        <div>
          <h3
            className={cn(
              "text-sm font-medium mb-1 transition-colors",
              variant === "light"
                ? "text-flow-900 group-hover:text-flow-black"
                : "text-flow-200 group-hover:text-white",
            )}
          >
            {product.name}
          </h3>
          <p className={cn("text-sm", variant === "light" ? "text-flow-600" : "text-flow-500")}>
            {formatLocalPrice(view.price, view.priceMxn) ?? "Precio no disponible"}
          </p>
          {activeVariants.length > 1 && (
            <div
              className="flex gap-1.5 mt-2"
              aria-label={`${activeVariants.length} colors available`}
            >
              {activeVariants.map((v) => {
                const isSelected = v.id === view.id;
                const style = v.colorHex
                  ? { backgroundColor: v.colorHex }
                  : undefined;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelected(v);
                    }}
                    onMouseEnter={() => setSelected(v)}
                    className={cn(
                      "w-3.5 h-3.5 rounded-full border transition-all",
                      !v.colorHex && colorSwatch(v.colorName),
                      isSelected
                        ? "ring-1 ring-offset-1 ring-flow-300 ring-offset-flow-950"
                        : "hover:scale-110",
                    )}
                    style={style}
                    title={v.colorName}
                    aria-pressed={isSelected}
                    aria-label={v.colorName}
                  />
                );
              })}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "~/lib/utils";
import { useLocale } from "~/context/LocaleContext";
import { QuickAdd } from "./QuickAdd";
import type { Product } from "~/data/mock";

interface ProductCardProps {
  product: Product;
  index?: number;
  variant?: "light" | "dark";
}

export function ProductCard({ product, index = 0, variant = "dark" }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const { formatLocalPrice } = useLocale();

  return (
    <motion.div
      className="group relative"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.075, duration: 0.5 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-flow-900 mb-3 rounded-2xl">
        <img
          src={product.image}
          alt={product.name}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
            hovered ? "opacity-0" : "opacity-100"
          )}
          loading="lazy"
        />
        <img
          src={product.imageHover}
          alt={`${product.name} alternate view`}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
            hovered ? "opacity-100" : "opacity-0"
          )}
          loading="lazy"
        />

        {/* Badge */}
        {product.badge && (
          <span
            className={cn(
              "absolute top-3 left-3 text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 font-medium rounded-full",
              product.badge === "New"
                ? "bg-white text-flow-black"
                : product.badge === "Low Stock"
                  ? "bg-red-600 text-white"
                  : "bg-flow-black text-white border border-flow-700"
            )}
          >
            {product.badge}
          </span>
        )}

        {/* Quick add */}
        <QuickAdd sizes={product.sizes} visible={hovered} />
      </div>

      {/* Info */}
      <div>
        <h3 className={cn(
          "text-sm font-medium mb-1 transition-colors",
          variant === "light"
            ? "text-flow-900 group-hover:text-flow-black"
            : "text-flow-200 group-hover:text-white"
        )}>
          {product.name}
        </h3>
        <p className={cn("text-sm", variant === "light" ? "text-flow-600" : "text-flow-500")}>
          {formatLocalPrice(product.price)}
        </p>
      </div>
    </motion.div>
  );
}

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "~/context/CartContext";
import { cn } from "~/lib/utils";

interface QuickAddProps {
  sizes: string[];
  visible: boolean;
  productId: string;
  productSlug: string;
  productName: string;
  productImage: string;
  productPrice: number;
  productPriceMxn: number;
  variantId?: string;
  variantSlug?: string;
  colorName?: string;
  sizeStock?: Record<string, number>;
}

export function QuickAdd({
  sizes,
  visible,
  productId,
  productSlug,
  productName,
  productImage,
  productPrice,
  productPriceMxn,
  variantId,
  variantSlug,
  colorName,
  sizeStock,
}: QuickAddProps) {
  const { addItem } = useCart();
  const [activeSize, setActiveSize] = useState<string | null>(null);

  const handleAdd = (e: React.MouseEvent, size: string) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId,
      variantId,
      productSlug,
      variantSlug,
      productName,
      colorName,
      productImage,
      size,
      price: productPrice,
      priceMxn: productPriceMxn,
    });
    setActiveSize(size);
    setTimeout(() => setActiveSize(null), 800);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-flow-black/90 backdrop-blur-sm px-3 py-3"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <p className="text-[10px] uppercase tracking-[0.2em] text-flow-400 mb-2">Quick Add</p>
          <div className="flex gap-1.5">
            {sizes.map((size) => {
              const unavailable = sizeStock ? (sizeStock[size] ?? 0) <= 0 : false;
              return (
                <button
                  key={size}
                  disabled={unavailable}
                  onClick={(e) => handleAdd(e, size)}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-medium rounded-full border transition-all duration-200",
                    unavailable && "opacity-30 line-through cursor-not-allowed border-flow-700 text-flow-500",
                    !unavailable && activeSize === size
                      ? "bg-green-500 text-white border-green-500"
                      : !unavailable &&
                          "text-flow-200 border-flow-700 hover:bg-white hover:text-flow-black hover:border-white",
                  )}
                >
                  {activeSize === size ? "✓" : size}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { Link } from "@remix-run/react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidePanel } from "./SlidePanel";
import { Button } from "~/components/ui/Button";
import { useCart } from "~/context/CartContext";
import { useLocale } from "~/context/LocaleContext";

interface CartPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartPanel({ isOpen, onClose }: CartPanelProps) {
  const { items, removeItem, updateQuantity, itemCount, subtotal, subtotalMxn } = useCart();
  const { formatLocalPrice } = useLocale();

  return (
    <SlidePanel isOpen={isOpen} onClose={onClose} title={`Cart (${itemCount})`}>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16">
          <svg
            className="w-16 h-16 text-flow-700 mb-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
          </svg>
          <p className="text-sm text-flow-400 mb-1">Your cart is empty</p>
          <p className="text-xs text-flow-600 mb-8">
            Add items to get started
          </p>
          <Button variant="outline" onClick={onClose}>
            Continue Shopping
          </Button>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Items list */}
          <div className="flex-1 -mx-6 px-6 overflow-y-auto space-y-4">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.div
                  key={`${item.productId}-${item.size}`}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="flex gap-3 py-3 border-b border-flow-800/50">
                    {/* Thumbnail */}
                    <Link
                      to={`/product/${item.productSlug}`}
                      onClick={onClose}
                      className="shrink-0"
                    >
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-12 h-16 object-cover rounded-lg"
                      />
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {item.productName}
                          </p>
                          <p className="text-xs text-flow-500 mt-0.5">
                            Size: {item.size}
                          </p>
                        </div>
                        {/* Remove button */}
                        <button
                          onClick={() => removeItem(item.productId, item.size)}
                          className="text-flow-600 hover:text-white transition-colors shrink-0"
                          aria-label={`Remove ${item.productName}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Qty + price */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.size,
                                item.quantity - 1
                              )
                            }
                            className="w-6 h-6 rounded-full border border-flow-700 flex items-center justify-center text-flow-300 hover:border-white hover:text-white transition-colors text-xs"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="text-sm text-white tabular-nums w-4 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.size,
                                item.quantity + 1
                              )
                            }
                            className="w-6 h-6 rounded-full border border-flow-700 flex items-center justify-center text-flow-300 hover:border-white hover:text-white transition-colors text-xs"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        <p className="text-sm text-flow-200 font-medium">
                          {formatLocalPrice(item.price * item.quantity, item.priceMxn * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="pt-5 mt-auto border-t border-flow-800/50">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs uppercase tracking-[0.2em] text-flow-500">
                Subtotal
              </span>
              <span className="text-xl font-display font-semibold text-white">
                {formatLocalPrice(subtotal, subtotalMxn)}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              <Link to="/checkout" onClick={onClose} className="block">
                <button className="w-full bg-white text-flow-black font-display font-semibold text-sm tracking-wide uppercase rounded-full px-6 py-4 hover:bg-flow-200 transition-colors">
                  Checkout
                </button>
              </Link>
              <button
                onClick={onClose}
                className="w-full border border-flow-600 text-flow-200 font-display font-medium text-sm tracking-wide uppercase rounded-full px-6 py-4 hover:bg-white hover:text-flow-black hover:border-white transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </SlidePanel>
  );
}

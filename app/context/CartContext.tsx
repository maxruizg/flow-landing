import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import type { CartItem } from "~/lib/types";

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (key: string, size: string) => void;
  updateQuantity: (key: string, size: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  subtotalMxn: number;
}

const STORAGE_KEY = "flow-cart";

const CartContext = createContext<CartContextValue | null>(null);

/** Item identity. Prefer variantId (variants-era); fall back to productId for
 *  cart entries persisted before PR 2 shipped. */
function itemKey(item: Pick<CartItem, "variantId" | "productId">): string {
  return item.variantId ?? item.productId;
}

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const nextKey = itemKey(item);
      const idx = prev.findIndex(
        (i) => itemKey(i) === nextKey && i.size === item.size,
      );
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        return updated;
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((key: string, size: string) => {
    setItems((prev) => prev.filter((i) => !(itemKey(i) === key && i.size === size)));
  }, []);

  const updateQuantity = useCallback((key: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => !(itemKey(i) === key && i.size === size)));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (itemKey(i) === key && i.size === size ? { ...i, quantity } : i)),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);
  const subtotalMxn = useMemo(
    () => items.reduce((sum, i) => sum + (i.priceMxn || 0) * i.quantity, 0),
    [items],
  );

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal, subtotalMxn }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export { itemKey };

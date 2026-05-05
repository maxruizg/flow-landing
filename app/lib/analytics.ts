/**
 * Client-side analytics helpers for GA4 e-commerce events.
 *
 * Each helper pushes the event onto window.dataLayer, which both gtag.js
 * (loaded by <GoogleAnalytics />) and GTM (loaded by <GoogleTagManager />)
 * read from. Calling gtag() and pushing to dataLayer would double-fire
 * when both containers are loaded — so we just push once and let each
 * container's own listener pick it up.
 *
 * All helpers no-op safely when called server-side or before the analytics
 * scripts have loaded (events queue in dataLayer until then).
 *
 * Currency defaults to MXN per the storefront's primary market.
 */

export interface EcommerceItem {
  item_id: string;
  item_name: string;
  item_variant?: string;
  item_brand?: string;
  item_category?: string;
  price: number;
  quantity?: number;
}

interface DataLayerEvent {
  event: string;
  ecommerce?: Record<string, unknown> | null;
  [key: string]: unknown;
}

const DEFAULT_CURRENCY = "MXN";

function push(payload: DataLayerEvent): void {
  if (typeof window === "undefined") return;
  // GTM expects ecommerce: null between events to clear the previous payload
  // — otherwise stale items leak across events. See GA4/GTM "Recommended
  // Events" docs.
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push(payload);
}

export function trackViewItem(input: {
  item: EcommerceItem;
  currency?: string;
  value?: number;
}): void {
  const value = input.value ?? input.item.price;
  push({
    event: "view_item",
    ecommerce: {
      currency: input.currency ?? DEFAULT_CURRENCY,
      value,
      items: [input.item],
    },
  });
}

export function trackAddToCart(input: {
  item: EcommerceItem;
  currency?: string;
  value?: number;
}): void {
  const qty = input.item.quantity ?? 1;
  const value = input.value ?? input.item.price * qty;
  push({
    event: "add_to_cart",
    ecommerce: {
      currency: input.currency ?? DEFAULT_CURRENCY,
      value,
      items: [{ ...input.item, quantity: qty }],
    },
  });
}

export function trackBeginCheckout(input: {
  items: EcommerceItem[];
  value: number;
  currency?: string;
}): void {
  push({
    event: "begin_checkout",
    ecommerce: {
      currency: input.currency ?? DEFAULT_CURRENCY,
      value: input.value,
      items: input.items,
    },
  });
}

const PURCHASE_DEDUPE_PREFIX = "flow:purchase:";

/**
 * Fire a `purchase` event exactly once per Stripe session id. Refreshing the
 * success page should not double-count revenue, so we stash a sessionStorage
 * flag keyed by the transaction id.
 */
export function trackPurchase(input: {
  transactionId: string;
  items: EcommerceItem[];
  value: number;
  currency?: string;
  tax?: number;
  shipping?: number;
  coupon?: string;
}): void {
  if (typeof window === "undefined") return;
  const key = PURCHASE_DEDUPE_PREFIX + input.transactionId;
  try {
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
  } catch {
    // sessionStorage may be blocked (private mode, strict ITP) — fall through
    // and accept the duplicate-on-refresh risk over silently dropping events.
  }
  push({
    event: "purchase",
    ecommerce: {
      transaction_id: input.transactionId,
      currency: input.currency ?? DEFAULT_CURRENCY,
      value: input.value,
      tax: input.tax,
      shipping: input.shipping,
      coupon: input.coupon,
      items: input.items,
    },
  });
}

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
  }
}

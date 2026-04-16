/**
 * Flat-rate shipping fees. Displayed at checkout and included in the
 * PaymentIntent total.
 *
 * Keep these in sync if you update one — orders store the total actually
 * charged, so changing them affects only new orders.
 */
export const SHIPPING_FEE_MXN = 150;
export const SHIPPING_FEE_USD = 9;

export type ShippingCurrency = "mxn" | "usd" | "MXN" | "USD";

export function shippingFee(currency: ShippingCurrency): number {
  return currency.toLowerCase() === "mxn" ? SHIPPING_FEE_MXN : SHIPPING_FEE_USD;
}

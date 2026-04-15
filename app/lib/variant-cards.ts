import type { Product, ProductVariant } from "~/lib/types";

export interface VariantCard {
  product: Product;
  variant: ProductVariant;
}

/** Expand a product list into one entry per active variant, preserving the
 *  parent product so cards can still surface the full swatch row. */
export function expandToVariantCards(products: Product[]): VariantCard[] {
  const out: VariantCard[] = [];
  for (const product of products) {
    const active = product.variants
      .filter((v) => v.status === "active")
      .sort((a, b) => a.sortOrder - b.sortOrder);
    for (const variant of active) {
      out.push({ product, variant });
    }
  }
  return out;
}

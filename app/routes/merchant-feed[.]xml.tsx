import { getAllProducts } from "~/data/queries.server";
import { optimizedImageUrl } from "~/lib/image";
import { SITE_URL, ORG_NAME, absoluteUrl } from "~/lib/seo";
import type { Product, ProductVariant } from "~/lib/types";

/**
 * Google Merchant Center product feed (RSS 2.0 + g: namespace) so FLOW
 * qualifies for free Google Shopping listings.
 *
 * Shape per Google's product data spec (support.google.com/merchants/answer/7052112):
 * apparel requires one item per size, grouped by item_group_id — so we emit
 * one <item> per variant (color) per size that has stock, with
 * id = `${variantId}-${size}` and item_group_id = productId.
 *
 * FLOW garments are own-brand apparel with no manufacturer GTIN/MPN, so each
 * item carries `identifier_exists: no` as the spec prescribes for
 * custom-made goods.
 */

const MAX_ADDITIONAL_IMAGES = 10; // hard limit per spec
const MAX_TITLE_LENGTH = 150; // hard limit per spec
const MAX_DESCRIPTION_LENGTH = 5000; // hard limit per spec

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/** Product.gender ("men" | "women" | "unisex") → Google's accepted values. */
function googleGender(gender: Product["gender"]): string {
  switch (gender) {
    case "men":
      return "male";
    case "women":
      return "female";
    default:
      return "unisex";
  }
}

function feedImageUrl(src: string): string {
  return absoluteUrl(optimizedImageUrl(src, 1280, 85));
}

function tag(name: string, value: string): string {
  return `      <${name}>${escapeXml(value)}</${name}>`;
}

function variantLink(product: Product, variant: ProductVariant): string {
  const url = new URL(`${SITE_URL}/product/${product.slug}`);
  url.searchParams.set("variant", variant.id);
  url.searchParams.set("utm_source", "google");
  url.searchParams.set("utm_medium", "organic_shopping");
  return url.toString();
}

function itemXml(
  product: Product,
  variant: ProductVariant,
  size: string,
  stock: number,
): string {
  const title = truncate(
    `${product.name} — ${variant.colorName} (${size})`,
    MAX_TITLE_LENGTH,
  );
  const description = truncate(
    variant.description ||
      `${product.name} — streetwear mexicano de ${ORG_NAME}, hecho en CDMX.`,
    MAX_DESCRIPTION_LENGTH,
  );

  const sourceImages =
    variant.images.length > 0 ? variant.images : [variant.image];
  const [mainImage, ...extraImages] = sourceImages;

  const fields = [
    tag("g:id", `${variant.id}-${size}`),
    tag("g:item_group_id", product.id),
    tag("g:title", title),
    tag("g:description", description),
    tag("g:link", variantLink(product, variant)),
    tag("g:image_link", feedImageUrl(mainImage)),
    ...extraImages
      .slice(0, MAX_ADDITIONAL_IMAGES)
      .map((img) => tag("g:additional_image_link", feedImageUrl(img))),
    tag("g:availability", stock > 0 ? "in_stock" : "out_of_stock"),
    tag("g:price", `${variant.priceMxn.toFixed(2)} MXN`),
    tag("g:brand", product.brand ?? ORG_NAME),
    tag("g:condition", "new"),
    // Own-brand apparel without manufacturer GTIN/MPN → identifier_exists no.
    tag("g:identifier_exists", "no"),
    tag("g:gender", googleGender(product.gender)),
    tag("g:age_group", "adult"),
    tag("g:color", variant.colorName),
    tag("g:size", size),
    ...(product.category ? [tag("g:product_type", product.category)] : []),
  ];

  return `    <item>\n${fields.join("\n")}\n    </item>`;
}

export async function loader() {
  const products = await getAllProducts();

  const items: string[] = [];
  for (const product of products) {
    for (const variant of product.variants) {
      if (variant.status !== "active") continue;
      if (!(variant.priceMxn > 0)) continue;

      for (const [size, stock] of Object.entries(variant.sizeStock ?? {})) {
        if (stock > 0) items.push(itemXml(product, variant, size, stock));
      }
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(ORG_NAME)}</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>${escapeXml(
      `Feed de productos de ${ORG_NAME} para Google Merchant Center.`,
    )}</description>
${items.join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

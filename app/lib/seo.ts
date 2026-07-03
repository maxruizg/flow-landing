import type { Product, ProductVariant } from "~/lib/types";
import { optimizedImageUrl } from "~/lib/image";

// Single source of truth for everything Google + social previews + crawlers
// see. Edit these values to change what shows up in search results, share
// previews, and the knowledge panel.

export const SITE_URL = "https://www.flowurbanwear.com";
export const ORG_NAME = "FLOW Urban Wear";
export const ORG_LEGAL_NAME = "FLOW Urban Wear";
export const ORG_DESCRIPTION =
  "Streetwear mexicano creado en CDMX por Dany Flow: hoodies oversized, graphic tees, shorts y accesorios. Envío DHL a todo México. Less thinking, more flow.";
export const ORG_SLOGAN = "Less Thinking More Flow";
export const ORG_FOUNDER = {
  name: "Daniela Flores",
  alternateName: "Dany Flow",
};
export const ORG_FOUNDING_DATE = "2022";
export const ORG_FOUNDING_LOCATION = "Mexico City, Mexico";

export const LOGO_PATH = "/images/logo/flow-wave-icon.png";
export const LOGO_URL = `${SITE_URL}${LOGO_PATH}`;
// 1200×630 brand card (public/images/og-default.jpg) — social platforms
// expect this ratio; the raw logo PNG is square and far too heavy for OG.
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/og-default.jpg`;

export const SOCIAL_URLS = [
  "https://www.instagram.com/flow_urbanwear",
  "https://www.tiktok.com/@flowurbanwear",
];

export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORG_NAME,
    legalName: ORG_LEGAL_NAME,
    url: SITE_URL,
    logo: LOGO_URL,
    description: ORG_DESCRIPTION,
    slogan: ORG_SLOGAN,
    founder: {
      "@type": "Person",
      name: ORG_FOUNDER.name,
      alternateName: ORG_FOUNDER.alternateName,
    },
    foundingDate: ORG_FOUNDING_DATE,
    foundingLocation: ORG_FOUNDING_LOCATION,
    sameAs: SOCIAL_URLS,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: ORG_NAME,
    url: SITE_URL,
  };
}

export function productJsonLd(
  product: Product,
  variant: ProductVariant,
  canonicalUrl: string,
) {
  const sourceImages =
    variant.images.length > 0 ? variant.images : [variant.image];
  const imageUrls = sourceImages.map((url) =>
    absoluteUrl(optimizedImageUrl(url, 1280, 85)),
  );

  const payload: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      variant.description ||
      `${product.name} — streetwear mexicano de ${ORG_NAME}, hecho en CDMX.`,
    image: imageUrls,
    brand: {
      "@type": "Brand",
      name: product.brand ?? ORG_NAME,
    },
  };

  // The storefront displays MXN by default, so the structured-data price must
  // be the MXN one. If no valid MXN price exists, omit `offers` entirely —
  // Google penalizes structured data that contradicts the visible page.
  if (variant.priceMxn > 0) {
    payload.offers = {
      "@type": "Offer",
      price: variant.priceMxn.toFixed(2),
      priceCurrency: "MXN",
      availability:
        variant.stock > 0 && variant.status === "active"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: canonicalUrl,
    };
  }

  if (variant.sku) payload.sku = variant.sku;

  return payload;
}

/**
 * XSS-safe JSON serializer for inline <script type="application/ld+json">.
 * Escapes:
 *  - `<` (blocks `</script>` injection — the only break-out vector in a
 *    script body)
 *  - U+2028 / U+2029 (line/paragraph separators that break JS string
 *    literals when the JSON is read as JS by some parsers)
 * Standard pattern shared by Next.js, React docs, and Google's JSON-LD guide.
 */
export function serializeJsonLd(payload: unknown): string {
  return JSON.stringify(payload)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

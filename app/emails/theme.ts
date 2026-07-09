/**
 * Shared FLOW email brand system.
 *
 * Single source of truth for email colors, fonts and reusable style fragments
 * so every template (order confirmation, newsletter, campaigns) reads as the
 * same brand. Mirrors the site tokens in app/styles/global.css — most
 * importantly the warm-taupe accent (#b8a490) and the Space Grotesk / Inter
 * type pairing, replacing the generic emerald / purple / red accents and
 * system fonts the templates used before.
 */

import { SITE_URL, SOCIAL_URLS } from "~/lib/seo";

export const colors = {
  // Surfaces (darkest → lighter), matching --color-flow-* tokens.
  black: "#0a0a0a", // --color-flow-black
  surface950: "#0d0d0d", // --color-flow-950
  surface900: "#171717", // --color-flow-900
  surface800: "#262626", // --color-flow-800 — borders / dividers
  border: "#262626",
  borderSoft: "#1a1a1a",
  borderFaint: "#404040", // --color-flow-700

  // Text.
  text: "#f5f5f5", // --color-flow-100
  textMuted: "#a3a3a3", // --color-flow-400
  textFaint: "#737373", // --color-flow-500
  textGhost: "#525252", // --color-flow-600
  white: "#ffffff",

  // Brand accent — warm taupe (--color-accent-500) and a translucent wash.
  accent: "#b8a490",
  accentDark: "#a08b75", // --color-accent-600
  accentSoftBg: "rgba(184, 164, 144, 0.10)",
  accentSoftBorder: "rgba(184, 164, 144, 0.30)",
} as const;

export const fonts = {
  // Web fonts load in clients that honour <style> @import (Apple Mail, iOS);
  // everyone else falls back gracefully down the stack.
  display: '"Space Grotesk", "Helvetica Neue", Helvetica, Arial, sans-serif',
  body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
} as const;

/** Drop into a template's <Head> via dangerouslySetInnerHTML to pull brand
 *  fonts on supporting clients. Safe to ignore where unsupported. */
export const fontImportCss =
  "@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');";

// Emails are rendered server-side (via @react-email/render in *.server.ts),
// so importing the canonical SEO constants keeps every email link on the
// same www host + social handles as the site itself.
export const brand = {
  name: "FLOW",
  tagline: "URBAN WEAR",
  site: SITE_URL,
  instagram: SOCIAL_URLS[0], // https://www.instagram.com/flow_urbanwear
  tiktok: SOCIAL_URLS[1], // https://www.tiktok.com/@flowurbanwear
  email: "contact@flowurbanwear.com",
} as const;

/* ─── Reusable style fragments ─── */

export const main = {
  backgroundColor: colors.black,
  fontFamily: fonts.body,
  margin: 0,
  padding: 0,
};

export const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px",
};

export const header = {
  textAlign: "center" as const,
  padding: "8px 0 24px 0",
};

export const logo = {
  fontFamily: fonts.display,
  fontSize: "32px",
  fontWeight: "700" as const,
  letterSpacing: "0.32em",
  color: colors.white,
  margin: "0",
  lineHeight: "1",
};

export const tagline = {
  fontFamily: fonts.body,
  fontSize: "10px",
  letterSpacing: "0.42em",
  color: colors.accent,
  margin: "6px 0 0 0",
  textTransform: "uppercase" as const,
};

export const divider = { borderColor: colors.border, margin: "24px 0" };
export const dividerSoft = { borderColor: colors.borderSoft, margin: "16px 0" };

export const heading = {
  fontFamily: fonts.display,
  fontSize: "26px",
  fontWeight: "700" as const,
  color: colors.white,
  lineHeight: "1.25",
  letterSpacing: "-0.01em",
  margin: "12px 0 12px 0",
};

export const bodyText = {
  fontFamily: fonts.body,
  fontSize: "15px",
  lineHeight: "1.7",
  color: colors.textMuted,
  margin: "0",
};

export const label = {
  fontFamily: fonts.body,
  fontSize: "11px",
  fontWeight: "700" as const,
  letterSpacing: "0.28em",
  textTransform: "uppercase" as const,
  color: colors.textFaint,
  margin: "0 0 16px 0",
};

/** Primary CTA — brand accent fill, dark text. The brand-forward default. */
export const ctaButton = {
  fontFamily: fonts.body,
  backgroundColor: colors.accent,
  color: colors.black,
  fontSize: "12px",
  fontWeight: "700" as const,
  letterSpacing: "0.2em",
  textTransform: "uppercase" as const,
  textDecoration: "none",
  padding: "16px 36px",
  borderRadius: "9999px",
  display: "inline-block",
};

export const accentPill = {
  display: "inline-block",
  fontFamily: fonts.body,
  fontSize: "10px",
  fontWeight: "600" as const,
  letterSpacing: "0.3em",
  textTransform: "uppercase" as const,
  color: colors.accent,
  backgroundColor: colors.accentSoftBg,
  border: `1px solid ${colors.accentSoftBorder}`,
  borderRadius: "9999px",
  padding: "6px 14px",
  margin: "0",
};

export const footer = {
  textAlign: "center" as const,
  padding: "16px 0 0 0",
};

export const footerText = {
  fontFamily: fonts.body,
  fontSize: "12px",
  color: colors.textFaint,
  margin: "0 0 10px 0",
};

export const footerSmall = {
  fontFamily: fonts.body,
  fontSize: "11px",
  color: colors.textGhost,
  margin: "0",
  lineHeight: "1.6",
};

export const socialLinks = {
  fontFamily: fonts.body,
  fontSize: "13px",
  color: colors.textGhost,
  margin: "0 0 16px 0",
};

export const socialLink = {
  color: colors.textMuted,
  textDecoration: "none",
};

export const footerLink = {
  color: colors.textMuted,
  textDecoration: "underline",
  textUnderlineOffset: "2px",
};

/**
 * Derive a translucent rgba() wash from a brand accent hex, so accent-tinted
 * surfaces (soft pills, active badges) recolor when the admin changes the
 * brand accent. Falls back to the taupe wash for malformed input.
 */
export function accentAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "").trim();
  if (h.length !== 6) return `rgba(184, 164, 144, ${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v)))
    return `rgba(184, 164, 144, ${alpha})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ─── Email-safe image URLs ─── */

/**
 * Rewrite Supabase Storage OBJECT URLs to Supabase's image-transform (Render)
 * endpoint so emails pull a properly sized + compressed variant. Deliberately
 * standalone (NOT importing app/lib/image.ts): that helper's Vercel branch
 * returns a RELATIVE `/_vercel/image?...` URL, which breaks in email — email
 * clients need absolute URLs. Everything that isn't a Supabase object URL
 * (placehold.co, www.flowurbanwear.com, data: URIs, already-transformed
 * render URLs) passes through unchanged.
 *
 * Verified prod pattern (returns 200, ~5x smaller):
 *   https://<ref>.supabase.co/storage/v1/render/image/public/images/<path>?width=600&quality=80&resize=contain
 */
export function emailImageUrl(src: string, width?: number): string {
  if (!src) return src;

  // Already transformed — idempotent, don't double-append params.
  if (src.includes("/storage/v1/render/image/public/")) return src;

  if (src.includes("/storage/v1/object/public/")) {
    const url = src.replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/",
    );
    const params = new URLSearchParams();
    if (width) params.set("width", String(width));
    params.set("quality", "80");
    params.set("resize", "contain");
    return `${url}${url.includes("?") ? "&" : "?"}${params.toString()}`;
  }

  return src;
}

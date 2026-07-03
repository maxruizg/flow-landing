/**
 * Image URL helpers. Two optimization paths:
 *
 * 1. Supabase Storage images — rewritten to Supabase's Render endpoint
 *    (`/storage/v1/render/image/public/...?width=&quality=&resize=contain`),
 *    which delivers a properly sized + compressed variant from Supabase's CDN.
 *    `resize=contain` preserves the original product photo aspect ratio —
 *    `cover` was the original cropping bug that caused this helper to be
 *    turned off.
 *
 * 2. Local `/images/*` assets — routed through Vercel Image Optimization
 *    (`/_vercel/image?url=&w=&q=`) in production only. The optimizer is
 *    enabled by the `images` block in vercel.json and does not run under
 *    `remix vite:dev`, so dev serves the raw file. Logo, favicon and OG
 *    assets are excluded: Google and social scrapers rely on those URLs
 *    being stable, byte-identical files.
 *
 * Anything else (external CDNs, data URIs) passes through unchanged so
 * callers don't have to special-case them.
 */

/**
 * Allowed widths for `/_vercel/image?w=`. MUST mirror `images.sizes` in
 * vercel.json — Vercel rejects any `w` that is not in that list.
 */
const VERCEL_IMAGE_SIZES = [
  160, 320, 480, 640, 828, 960, 1080, 1280, 1600, 1920,
] as const;

const DEFAULT_LOCAL_WIDTH = 1280;

export function optimizedImageUrl(
  src: string,
  width?: number,
  quality = 80,
): string {
  if (!src) return src;

  if (isSupabaseStorage(src)) {
    const url = src.replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/",
    );
    const params = new URLSearchParams();
    if (width) params.set("width", String(width));
    params.set("quality", String(clampQuality(quality)));
    params.set("resize", "contain");
    return `${url}${url.includes("?") ? "&" : "?"}${params.toString()}`;
  }

  if (isVercelOptimizable(src)) {
    const w = snapToVercelSize(width ?? DEFAULT_LOCAL_WIDTH);
    const params = new URLSearchParams({
      url: src,
      w: String(w),
      q: String(clampQuality(quality)),
    });
    return `/_vercel/image?${params.toString()}`;
  }

  return src;
}

export function buildSrcSet(
  src: string,
  widths: number[],
  quality = 80,
): string | undefined {
  if (!widths || widths.length === 0) return undefined;

  if (isSupabaseStorage(src)) {
    return widths
      .map((w) => `${optimizedImageUrl(src, w, quality)} ${w}w`)
      .join(", ");
  }

  if (isVercelOptimizable(src)) {
    // Snap to the allowed size list first, then dedupe — several requested
    // widths can collapse onto the same allowed size.
    const snapped = [...new Set(widths.map(snapToVercelSize))].sort(
      (a, b) => a - b,
    );
    return snapped
      .map((w) => `${optimizedImageUrl(src, w, quality)} ${w}w`)
      .join(", ");
  }

  return undefined;
}

function isSupabaseStorage(src: string): boolean {
  return src.includes("/storage/v1/object/public/");
}

/**
 * Local static assets eligible for Vercel Image Optimization. Production
 * only — `/_vercel/image` 404s in `remix vite:dev`. Logo / favicon / OG
 * files are deliberately excluded so crawlers keep stable URLs.
 */
function isVercelOptimizable(src: string): boolean {
  if (!import.meta.env.PROD) return false;
  if (!src.startsWith("/images/")) return false;
  if (src.startsWith("/images/logo/")) return false;
  if (src.startsWith("/images/og-")) return false;
  if (src.includes("favicon")) return false;
  return true;
}

/** Smallest allowed size >= requested width (or the largest allowed). */
function snapToVercelSize(width: number): number {
  for (const size of VERCEL_IMAGE_SIZES) {
    if (size >= width) return size;
  }
  return VERCEL_IMAGE_SIZES[VERCEL_IMAGE_SIZES.length - 1];
}

function clampQuality(quality: number): number {
  return Math.max(1, Math.min(100, Math.round(quality)));
}

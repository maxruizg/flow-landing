/**
 * Build a Supabase Storage Render URL for a given source image. Supabase
 * Render rewrites `/storage/v1/object/public/<path>` to
 * `/storage/v1/render/image/public/<path>?width=...&quality=...&resize=...`
 * which delivers a properly sized + compressed variant from the CDN.
 *
 * Defaulting `resize=contain` preserves the original product photo aspect
 * ratio — `cover` was the original cropping bug that caused this helper to
 * be turned off.
 *
 * Non-Supabase URLs (local /public/images, external CDNs) pass through
 * unchanged so callers don't have to special-case them.
 */
export function optimizedImageUrl(
  src: string,
  width?: number,
  quality = 80,
): string {
  if (!src) return src;
  if (!isSupabaseStorage(src)) return src;
  const url = src.replace(
    "/storage/v1/object/public/",
    "/storage/v1/render/image/public/",
  );
  const params = new URLSearchParams();
  if (width) params.set("width", String(width));
  params.set("quality", String(Math.max(1, Math.min(100, quality))));
  params.set("resize", "contain");
  return `${url}${url.includes("?") ? "&" : "?"}${params.toString()}`;
}

export function buildSrcSet(
  src: string,
  widths: number[],
  quality = 80,
): string | undefined {
  if (!isSupabaseStorage(src)) return undefined;
  if (!widths || widths.length === 0) return undefined;
  return widths
    .map((w) => `${optimizedImageUrl(src, w, quality)} ${w}w`)
    .join(", ");
}

function isSupabaseStorage(src: string): boolean {
  return src.includes("/storage/v1/object/public/");
}

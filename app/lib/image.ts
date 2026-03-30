const SUPABASE_STORAGE_PATH = "/storage/v1/object/public/";
const SUPABASE_RENDER_PATH = "/storage/v1/render/image/public/";

/**
 * Converts a Supabase Storage public URL into a transform URL with resizing.
 * For non-Supabase URLs (local /images/...), returns the original URL unchanged.
 */
export function optimizedImageUrl(
  src: string,
  width: number,
  quality = 80
): string {
  if (!src || !src.includes(SUPABASE_STORAGE_PATH)) {
    return src;
  }

  const base = src.replace(SUPABASE_STORAGE_PATH, SUPABASE_RENDER_PATH);
  return `${base}?width=${width}&quality=${quality}&resize=cover`;
}

/**
 * Builds a srcSet string from a list of widths for responsive images.
 * Only generates srcSet for Supabase-hosted images.
 */
export function buildSrcSet(
  src: string,
  widths: number[],
  quality = 80
): string | undefined {
  if (!src || !src.includes(SUPABASE_STORAGE_PATH)) {
    return undefined;
  }

  return widths
    .map((w) => `${optimizedImageUrl(src, w, quality)} ${w}w`)
    .join(", ");
}

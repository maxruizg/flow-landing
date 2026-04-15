/**
 * Returns the image URL as-is. Supabase render transforms were causing
 * incorrect cropping, so we serve originals and let CSS handle sizing.
 */
export function optimizedImageUrl(
  src: string,
  _width?: number,
  _quality?: number
): string {
  return src;
}

/**
 * Returns undefined — no srcSet needed when serving originals.
 */
export function buildSrcSet(
  _src: string,
  _widths: number[],
  _quality?: number
): string | undefined {
  return undefined;
}

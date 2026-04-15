export const COLOR_HEX_MAP: Record<string, string> = {
  black: "#1a1a1a",
  brown: "#6b4226",
  "off white": "#efe9dc",
  offwhite: "#efe9dc",
  white: "#ffffff",
  yellow: "#f5c518",
  beige: "#d9c7a4",
};

export function colorHex(colorName: string): string | null {
  return COLOR_HEX_MAP[colorName.toLowerCase().trim()] ?? null;
}

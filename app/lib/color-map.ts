export const COLOR_MAP: Record<string, string> = {
  Black: "bg-flow-900 border-flow-600",
  black: "bg-flow-900 border-flow-600",
  Brown: "bg-stone-700 border-stone-500",
  brown: "bg-stone-700 border-stone-500",
  "Off White": "bg-stone-200 border-stone-300",
  offwhite: "bg-stone-200 border-stone-300",
  White: "bg-white border-flow-300",
  white: "bg-white border-flow-300",
  Yellow: "bg-yellow-400 border-yellow-500",
  yellow: "bg-yellow-400 border-yellow-500",
  Beige: "bg-stone-300 border-stone-400",
};

export function colorSwatch(color: string): string {
  return COLOR_MAP[color] || COLOR_MAP[color?.toLowerCase?.() ?? ""] || "bg-flow-700 border-flow-500";
}

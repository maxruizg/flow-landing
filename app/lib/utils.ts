import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(name: string, color: string, gender: string): string {
  return `${name}-${color}-${gender}`.toLowerCase().replace(/\s+/g, "-");
}

export function formatPrice(amount: number, currency: string = "USD"): string {
  const code = (currency || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Unknown/garbage currency code — never crash a render over formatting.
    return `${code} ${Math.round(amount).toLocaleString("en-US")}`;
  }
}

export function formatShippingAddress(raw: string): string[] {
  if (!raw) return [];
  try {
    const a = JSON.parse(raw) as {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
    if (!a || typeof a !== "object") return [raw];
    const lines: string[] = [];
    if (a.line1) lines.push(a.line1);
    if (a.line2) lines.push(a.line2);
    const cityLine = [a.city, a.state, a.postal_code].filter(Boolean).join(", ");
    if (cityLine) lines.push(cityLine);
    if (a.country) lines.push(a.country);
    return lines.length ? lines : [raw];
  } catch {
    return [raw];
  }
}

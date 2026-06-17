import { createCookie, createCookieSessionStorage } from "@remix-run/node";

// ───────────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────────

export type Currency = "MXN" | "USD";
export type Language = "en" | "es";
export type Country = "US" | "MX";
export type CheckoutStep = "cart" | "shipping" | "payment" | "confirmation";

export interface Locale {
  currency: Currency;
  language: Language;
  country: Country;
}
export type SizePreference = "XS" | "S" | "M" | "L" | "XL" | "XXL" | (string & {});

export interface CookieConsent {
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

export interface FilterPrefs {
  colors?: string[];
  category?: string;
  gender?: string;
  priceMin?: number;
  priceMax?: number;
  sizes?: string[];
}

export const DEFAULT_CURRENCY: Currency = "MXN";
export const DEFAULT_LANGUAGE: Language = "es";
export const DEFAULT_COUNTRY: Country = "MX";

export const DEFAULT_CONSENT: CookieConsent = {
  analytics: false,
  marketing: false,
  personalization: false,
};

export const FULL_CONSENT: CookieConsent = {
  analytics: true,
  marketing: true,
  personalization: true,
};

const CHECKOUT_STEPS: readonly CheckoutStep[] = [
  "cart",
  "shipping",
  "payment",
  "confirmation",
];

// ───────────────────────────────────────────────────────────────────────────
// Cookie instances
// ───────────────────────────────────────────────────────────────────────────

const SECRETS = [process.env.SESSION_SECRET || "dev-secret-change-in-production"];
const IS_PROD = process.env.NODE_ENV === "production";

const ESSENTIAL_OPTIONS = {
  httpOnly: true as const,
  secure: IS_PROD,
  sameSite: "strict" as const,
  path: "/",
  secrets: SECRETS,
};

const PERSONALIZATION_OPTIONS = {
  httpOnly: true as const,
  secure: IS_PROD,
  sameSite: "lax" as const,
  path: "/",
  secrets: SECRETS,
};

// 1. session_id — Remix session storage (HttpOnly, Strict, 30d)
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "session_id",
    ...ESSENTIAL_OPTIONS,
    maxAge: 60 * 60 * 24 * 30,
  },
});

// 2. cart_token — guest cart identifier (30d)
export const cartTokenCookie = createCookie("cart_token", {
  ...ESSENTIAL_OPTIONS,
  maxAge: 60 * 60 * 24 * 30,
});

// 3. csrf_token — CSRF double-submit token (1d)
export const csrfCookie = createCookie("csrf_token", {
  ...ESSENTIAL_OPTIONS,
  maxAge: 60 * 60 * 24,
});

// 4. locale (flow_currency / flow_language / flow_country) — selected UI prefs.
//    These are plain, NON-HttpOnly, UNSIGNED cookies so the client can write them
//    synchronously via document.cookie (see app/context/LocaleContext.tsx). They
//    carry no security weight — a visitor can already pick any currency/language —
//    and writing them client-side eliminates the read-after-navigation race that a
//    server round-trip introduced. They are read back here in `resolveLocale`.
//    The legacy signed `currency`/`language`/`country` HttpOnly cookies are no
//    longer written; they simply expire unused.
export const LOCALE_COOKIE_NAMES = {
  currency: "flow_currency",
  language: "flow_language",
  country: "flow_country",
} as const;
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

// 5. checkout_step — last reached checkout step (7d)
export const checkoutStepCookie = createCookie("checkout_step", {
  ...ESSENTIAL_OPTIONS,
  maxAge: 60 * 60 * 24 * 7,
});

// 6. cookie_consent — user consent preferences (180d, Lax to survive external referrals)
export const consentCookie = createCookie("cookie_consent", {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: "lax",
  path: "/",
  secrets: SECRETS,
  maxAge: 60 * 60 * 24 * 180,
});

// 7. recently_viewed — last 10 product ids (90d, personalization-gated)
export const recentlyViewedCookie = createCookie("recently_viewed", {
  ...PERSONALIZATION_OPTIONS,
  maxAge: 60 * 60 * 24 * 90,
});

// 8. size_preference — preferred clothing size (180d, personalization-gated)
export const sizePreferenceCookie = createCookie("size_preference", {
  ...PERSONALIZATION_OPTIONS,
  maxAge: 60 * 60 * 24 * 180,
});

// 9. newsletter_dismissed — newsletter modal dismissal (180d, personalization-gated)
export const newsletterDismissedCookie = createCookie("newsletter_dismissed", {
  ...PERSONALIZATION_OPTIONS,
  maxAge: 60 * 60 * 24 * 180,
});

// 10. filter_prefs — last used search filters (90d, personalization-gated)
export const filterPrefsCookie = createCookie("filter_prefs", {
  ...PERSONALIZATION_OPTIONS,
  maxAge: 60 * 60 * 24 * 90,
});

// 11. flow_vid — opaque visitor id for first-party analytics (1y).
//     Not PII, not signed: it's just a random token that lets us dedupe
//     "unique visitors" in the admin analytics page.
export const visitorIdCookie = createCookie("flow_vid", {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
});

// ───────────────────────────────────────────────────────────────────────────
// Helpers — essential cookies
// ───────────────────────────────────────────────────────────────────────────

function cookieHeader(request: Request): string | null {
  return request.headers.get("Cookie");
}

export async function getConsent(request: Request): Promise<CookieConsent | null> {
  const parsed = await consentCookie.parse(cookieHeader(request));
  if (!parsed || typeof parsed !== "object") return null;
  return {
    analytics: Boolean((parsed as CookieConsent).analytics),
    marketing: Boolean((parsed as CookieConsent).marketing),
    personalization: Boolean((parsed as CookieConsent).personalization),
  };
}

export async function serializeConsent(consent: CookieConsent): Promise<string> {
  return consentCookie.serialize(consent);
}

/** Read a single cookie's raw value out of a `Cookie:` header string. */
function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return undefined;
}

/**
 * Initial locale for a visitor: an explicit choice (the plain `flow_*` cookie,
 * written client-side) always wins; any field without a valid cookie falls back
 * to a geo default derived from Vercel's `x-vercel-ip-country` header. A US IP
 * yields a full US profile (USD/en/US); everything else — including local dev
 * where the header is absent — yields the MXN/es/MX defaults. We intentionally do
 * not Set-Cookie here: the value is recomputed cheaply each load until the user
 * explicitly picks.
 */
export async function resolveLocale(request: Request): Promise<Locale> {
  const geo: Locale =
    request.headers.get("x-vercel-ip-country") === "US"
      ? { currency: "USD", language: "en", country: "US" }
      : { currency: DEFAULT_CURRENCY, language: DEFAULT_LANGUAGE, country: DEFAULT_COUNTRY };

  const header = cookieHeader(request);
  const currency = readCookie(header, LOCALE_COOKIE_NAMES.currency);
  const language = readCookie(header, LOCALE_COOKIE_NAMES.language);
  const country = readCookie(header, LOCALE_COOKIE_NAMES.country);

  return {
    currency: currency === "USD" || currency === "MXN" ? currency : geo.currency,
    language: language === "en" || language === "es" ? language : geo.language,
    country: country === "US" || country === "MX" ? country : geo.country,
  };
}

export async function getCheckoutStep(request: Request): Promise<CheckoutStep | null> {
  const parsed = await checkoutStepCookie.parse(cookieHeader(request));
  if (typeof parsed === "string" && (CHECKOUT_STEPS as readonly string[]).includes(parsed)) {
    return parsed as CheckoutStep;
  }
  return null;
}

export async function serializeCheckoutStep(step: CheckoutStep): Promise<string> {
  return checkoutStepCookie.serialize(step);
}

export async function getCartToken(
  request: Request,
): Promise<{ token: string; setCookie: string | null }> {
  const existing = await cartTokenCookie.parse(cookieHeader(request));
  if (typeof existing === "string" && existing.length > 0) {
    return { token: existing, setCookie: null };
  }
  const token = randomToken(16);
  return { token, setCookie: await cartTokenCookie.serialize(token) };
}

export async function getOrCreateVisitorId(
  request: Request,
): Promise<{ visitorId: string; setCookie: string | null }> {
  const existing = await visitorIdCookie.parse(cookieHeader(request));
  if (typeof existing === "string" && existing.length >= 16) {
    return { visitorId: existing, setCookie: null };
  }
  const visitorId = randomToken(16);
  return { visitorId, setCookie: await visitorIdCookie.serialize(visitorId) };
}

// ───────────────────────────────────────────────────────────────────────────
// Helpers — CSRF (double-submit pattern)
// ───────────────────────────────────────────────────────────────────────────

/**
 * Reads the CSRF token from the request cookie, creating one if missing.
 * Render the returned `token` as a hidden `<input name="_csrf">` in every form
 * and attach `setCookie` (if non-null) to the response headers.
 */
export async function getOrCreateCsrfToken(
  request: Request,
): Promise<{ token: string; setCookie: string | null }> {
  const existing = await csrfCookie.parse(cookieHeader(request));
  if (typeof existing === "string" && existing.length >= 32) {
    return { token: existing, setCookie: null };
  }
  const token = randomToken(32);
  return { token, setCookie: await csrfCookie.serialize(token) };
}

/**
 * Validates a form submission's CSRF token against the cookie token.
 * Throws a 403 Response on mismatch.
 */
export async function validateCsrf(request: Request, formData: FormData): Promise<void> {
  const cookieToken = await csrfCookie.parse(cookieHeader(request));
  const formToken = formData.get("_csrf");
  if (
    typeof cookieToken !== "string" ||
    typeof formToken !== "string" ||
    cookieToken.length < 32 ||
    cookieToken !== formToken
  ) {
    throw new Response("Invalid CSRF token", { status: 403 });
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Helpers — personalization (consent-gated)
// ───────────────────────────────────────────────────────────────────────────

const MAX_RECENTLY_VIEWED = 10;

function canPersonalize(consent: CookieConsent | null): boolean {
  return consent?.personalization === true;
}

export async function getRecentlyViewed(request: Request): Promise<string[]> {
  const parsed = await recentlyViewedCookie.parse(cookieHeader(request));
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((v): v is string => typeof v === "string").slice(0, MAX_RECENTLY_VIEWED);
}

export async function serializeRecentlyViewed(
  request: Request,
  productId: string,
  consent: CookieConsent | null,
): Promise<string | null> {
  if (!canPersonalize(consent)) return null;
  const current = await getRecentlyViewed(request);
  const next = [productId, ...current.filter((id) => id !== productId)].slice(0, MAX_RECENTLY_VIEWED);
  return recentlyViewedCookie.serialize(next);
}

export async function getSizePreference(request: Request): Promise<SizePreference | null> {
  const parsed = await sizePreferenceCookie.parse(cookieHeader(request));
  return typeof parsed === "string" && parsed.length > 0 ? parsed : null;
}

export async function serializeSizePreference(
  size: SizePreference,
  consent: CookieConsent | null,
): Promise<string | null> {
  if (!canPersonalize(consent)) return null;
  return sizePreferenceCookie.serialize(size);
}

export async function getNewsletterDismissed(request: Request): Promise<boolean> {
  const parsed = await newsletterDismissedCookie.parse(cookieHeader(request));
  return parsed === true || parsed === "true";
}

export async function serializeNewsletterDismissed(
  dismissed: boolean,
  consent: CookieConsent | null,
): Promise<string | null> {
  if (!canPersonalize(consent)) return null;
  return newsletterDismissedCookie.serialize(dismissed);
}

export async function getFilterPrefs(request: Request): Promise<FilterPrefs> {
  const parsed = await filterPrefsCookie.parse(cookieHeader(request));
  if (!parsed || typeof parsed !== "object") return {};
  const p = parsed as FilterPrefs;
  return {
    colors: Array.isArray(p.colors) ? p.colors.filter((c) => typeof c === "string") : undefined,
    category: typeof p.category === "string" ? p.category : undefined,
    gender: typeof p.gender === "string" ? p.gender : undefined,
    priceMin: typeof p.priceMin === "number" ? p.priceMin : undefined,
    priceMax: typeof p.priceMax === "number" ? p.priceMax : undefined,
    sizes: Array.isArray(p.sizes) ? p.sizes.filter((s) => typeof s === "string") : undefined,
  };
}

export async function serializeFilterPrefs(
  prefs: FilterPrefs,
  consent: CookieConsent | null,
): Promise<string | null> {
  if (!canPersonalize(consent)) return null;
  return filterPrefsCookie.serialize(prefs);
}

/**
 * Clears every personalization cookie — call on consent downgrade.
 * Returns a list of Set-Cookie strings to append to the response headers.
 */
export async function clearPersonalizationCookies(): Promise<string[]> {
  return Promise.all([
    recentlyViewedCookie.serialize("", { maxAge: 0 }),
    sizePreferenceCookie.serialize("", { maxAge: 0 }),
    newsletterDismissedCookie.serialize("", { maxAge: 0 }),
    filterPrefsCookie.serialize("", { maxAge: 0 }),
  ]);
}

// ───────────────────────────────────────────────────────────────────────────
// Internal
// ───────────────────────────────────────────────────────────────────────────

function randomToken(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

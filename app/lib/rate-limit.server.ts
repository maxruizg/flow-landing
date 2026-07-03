import { supabase } from "~/lib/supabase.server";

/**
 * Fixed-window rate limiter backed by the `rate_limits` Supabase table and the
 * `increment_rate_limit` RPC (see supabase/migrations/2026-07-02-rate-limits.sql).
 *
 * FAILS OPEN: if the table/RPC hasn't been created yet, or Supabase errors for
 * any reason, requests are allowed (with a console.warn). Availability over
 * strictness — a broken limiter must never take the store down.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

/**
 * Best-effort client IP on Vercel: `x-forwarded-for` is set by the platform
 * (first entry is the client), `x-real-ip` as a fallback.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip")?.trim();
  return real || "unknown";
}

/**
 * Count a hit against `key` and report whether it is within `limit` hits per
 * `windowSeconds`. The increment happens atomically in Postgres, so concurrent
 * requests can't slip past the limit by racing each other.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabase.rpc("increment_rate_limit", {
      p_key: key,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      // 42883 = undefined function, PGRST202 = PostgREST can't find the RPC,
      // 42P01 = missing table — all mean the migration hasn't been applied.
      // Any other error also fails open.
      console.warn(
        `[rate-limit] increment_rate_limit failed (${(error as { code?: string }).code ?? "unknown"}): ` +
          `${error.message} — failing open. Apply supabase/migrations/2026-07-02-rate-limits.sql.`,
      );
      return { allowed: true, remaining: limit };
    }

    const row = Array.isArray(data) ? data[0] : data;
    const count = Number(
      (row as { request_count?: number } | null | undefined)?.request_count ?? 0,
    );
    if (!Number.isFinite(count) || count <= 0) {
      // Unexpected shape — fail open rather than block real traffic.
      console.warn("[rate-limit] Unexpected RPC response shape — failing open.");
      return { allowed: true, remaining: limit };
    }

    return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
  } catch (err) {
    console.warn("[rate-limit] Unexpected error — failing open:", err);
    return { allowed: true, remaining: limit };
  }
}

import { render } from "@react-email/render";
import { supabase } from "~/lib/supabase.server";
import { getResend } from "~/lib/resend.server";
import {
  AbandonedCartEmail,
  type AbandonedCartItem,
} from "~/emails/abandoned-cart";

/**
 * Abandoned-cart recovery.
 *
 * Capture: `upsertAbandonedCart` is fired (fire-and-forget) from the checkout
 * flow once the shopper has provided an email. One live cart per email
 * (unique constraint) — see supabase/migrations/2026-07-02-abandoned-carts.sql.
 *
 * Recovery: `markCartRecovered` is fired after an order is created.
 *
 * Sending: `sendAbandonedCartReminders` runs inside the hourly cron
 * (GET /api/run-scheduled-campaigns). Carts idle for 3+ hours get ONE
 * Spanish reminder; reminder_sent_at is claimed with a compare-and-set
 * BEFORE sending so overlapping cron runs can never double-send.
 *
 * Everything here FAILS SOFT: a missing table (migration not applied yet),
 * a Supabase error or a Resend error must never break checkout, order
 * creation or the campaign cron.
 */

const ABANDONED_AFTER_MS = 3 * 60 * 60 * 1000; // 3 hours
const MAX_REMINDERS_PER_RUN = 20;

export interface AbandonedCartInput {
  email: string;
  name?: string | null;
  items: AbandonedCartItem[];
  total?: number | null;
  currency?: string | null;
  locale?: string | null;
}

export interface AbandonedCartReminderStats {
  /** Carts due for a reminder that this run looked at. */
  scanned: number;
  /** Reminders successfully handed to Resend. */
  sent: number;
  /** Claimed carts whose Resend send failed. */
  failed: number;
  /** Carts skipped because the shopper unsubscribed (subscribers.active = false). */
  skippedUnsubscribed: number;
  /** Carts retired because an order for that email already exists. */
  markedRecovered: number;
  /** Set when the whole run aborted early (e.g. missing table). */
  error?: string;
}

// ─── Helpers ────────────────────────────────────────────────────

/** Postgres 42P01 = undefined_table → the migration hasn't been applied. */
function isMissingTable(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: unknown }).code === "42P01"
  );
}

function warnMissingTable(op: string): void {
  console.warn(
    `[abandoned-carts] ${op} skipped — abandoned_carts table missing. ` +
      "Apply supabase/migrations/2026-07-02-abandoned-carts.sql.",
  );
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Stable fingerprint of what's actually IN the cart. Quantity/variant/size
 * changes count as "meaningfully changed" (→ reminder eligibility resets);
 * a mere re-capture of the same contents does not.
 */
function itemsFingerprint(items: AbandonedCartItem[]): string {
  return items
    .map(
      (i) =>
        `${(i as AbandonedCartItem & { variantId?: string }).variantId ?? i.productName}|${i.size ?? ""}|${i.quantity}`,
    )
    .sort()
    .join("~");
}

// ─── Capture ────────────────────────────────────────────────────

/**
 * Insert or refresh the single live cart for this email. Clears
 * reminder_sent_at ONLY when the cart contents changed meaningfully (so an
 * unchanged cart never earns a second reminder) and always clears
 * recovered_at (a fresh capture means a new, not-yet-recovered session).
 * Never throws.
 */
export async function upsertAbandonedCart(input: AbandonedCartInput): Promise<void> {
  try {
    const email = normalizeEmail(input.email || "");
    if (!EMAIL_RE.test(email)) return;
    if (!Array.isArray(input.items) || input.items.length === 0) return;

    const now = new Date().toISOString();
    const { data: existing, error: selectError } = await supabase
      .from("abandoned_carts")
      .select("id, items, reminder_sent_at")
      .eq("email", email)
      .maybeSingle();

    if (selectError) {
      if (isMissingTable(selectError)) return warnMissingTable("upsertAbandonedCart");
      console.warn("[abandoned-carts] upsert select failed:", selectError.message);
      return;
    }

    if (existing) {
      const changed =
        itemsFingerprint((existing.items as AbandonedCartItem[]) ?? []) !==
        itemsFingerprint(input.items);
      const { error: updateError } = await supabase
        .from("abandoned_carts")
        .update({
          customer_name: input.name ?? null,
          items: input.items,
          total: input.total ?? null,
          currency: input.currency ?? null,
          locale: input.locale ?? null,
          updated_at: now,
          recovered_at: null,
          ...(changed ? { reminder_sent_at: null } : {}),
        })
        .eq("id", existing.id);
      if (updateError) {
        console.warn("[abandoned-carts] upsert update failed:", updateError.message);
      }
      return;
    }

    const { error: insertError } = await supabase.from("abandoned_carts").insert({
      email,
      customer_name: input.name ?? null,
      items: input.items,
      total: input.total ?? null,
      currency: input.currency ?? null,
      locale: input.locale ?? null,
      created_at: now,
      updated_at: now,
    });
    if (insertError) {
      if (isMissingTable(insertError)) return warnMissingTable("upsertAbandonedCart");
      // 23505 = another request inserted this email between our select and
      // insert. Fall through to a plain refresh of the row they created.
      if ((insertError as { code?: string }).code === "23505") {
        const { error: retryError } = await supabase
          .from("abandoned_carts")
          .update({
            customer_name: input.name ?? null,
            items: input.items,
            total: input.total ?? null,
            currency: input.currency ?? null,
            locale: input.locale ?? null,
            updated_at: now,
            recovered_at: null,
          })
          .eq("email", email);
        if (retryError) {
          console.warn("[abandoned-carts] upsert race retry failed:", retryError.message);
        }
        return;
      }
      console.warn("[abandoned-carts] upsert insert failed:", insertError.message);
    }
  } catch (err) {
    console.warn("[abandoned-carts] upsertAbandonedCart unexpected error:", err);
  }
}

/**
 * Stamp the cart for this email as recovered (an order was created), so the
 * reminder job never emails a shopper who already bought. Never throws.
 */
export async function markCartRecovered(email: string): Promise<void> {
  try {
    const normalized = normalizeEmail(email || "");
    if (!normalized) return;
    const { error } = await supabase
      .from("abandoned_carts")
      .update({ recovered_at: new Date().toISOString() })
      .eq("email", normalized)
      .is("recovered_at", null);
    if (error) {
      if (isMissingTable(error)) return warnMissingTable("markCartRecovered");
      console.warn("[abandoned-carts] markCartRecovered failed:", error.message);
    }
  } catch (err) {
    console.warn("[abandoned-carts] markCartRecovered unexpected error:", err);
  }
}

// ─── Reminder job (runs inside the hourly campaign cron) ───────

export async function sendAbandonedCartReminders(): Promise<AbandonedCartReminderStats> {
  const stats: AbandonedCartReminderStats = {
    scanned: 0,
    sent: 0,
    failed: 0,
    skippedUnsubscribed: 0,
    markedRecovered: 0,
  };

  try {
    const cutoff = new Date(Date.now() - ABANDONED_AFTER_MS).toISOString();
    const { data: carts, error: queryError } = await supabase
      .from("abandoned_carts")
      .select("id, email, customer_name, items, total, currency, locale, updated_at")
      .is("reminder_sent_at", null)
      .is("recovered_at", null)
      .lt("updated_at", cutoff)
      .order("updated_at", { ascending: true })
      .limit(MAX_REMINDERS_PER_RUN);

    if (queryError) {
      if (isMissingTable(queryError)) {
        warnMissingTable("sendAbandonedCartReminders");
        return { ...stats, error: "abandoned_carts table missing" };
      }
      console.error("[abandoned-carts] reminder query failed:", queryError.message);
      return { ...stats, error: queryError.message };
    }

    if (!carts || carts.length === 0) return stats;
    stats.scanned = carts.length;

    // Respect unsubscribes: subscribers.active = false means "never email me
    // marketing again" (same flag the campaign engine filters on).
    const unsubscribed = new Set<string>();
    try {
      const emails = carts.map((c: { email: string }) => c.email);
      const { data: subs, error: subsError } = await supabase
        .from("subscribers")
        .select("email")
        .in("email", emails)
        .eq("active", false);
      if (subsError) {
        console.warn("[abandoned-carts] unsubscribe lookup failed:", subsError.message);
      } else {
        for (const s of subs ?? []) unsubscribed.add(normalizeEmail(s.email));
      }
    } catch (err) {
      console.warn("[abandoned-carts] unsubscribe lookup unexpected error:", err);
    }

    const resend = getResend();
    const from =
      process.env.RESEND_FROM_EMAIL || "Flow Urban Wear <contact@flowurbanwear.com>";

    for (const cart of carts) {
      // Atomic claim: set reminder_sent_at only if still null. A concurrent
      // cron run racing us loses (0 rows updated) and skips the cart —
      // exactly-once sending without locks.
      const { data: claimedRows, error: claimError } = await supabase
        .from("abandoned_carts")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", cart.id)
        .is("reminder_sent_at", null)
        .select("id");
      if (claimError) {
        console.error(`[abandoned-carts] claim failed for ${cart.id}:`, claimError.message);
        continue;
      }
      if (!claimedRows || claimedRows.length === 0) continue; // lost the race

      // Retired without sending: shopper unsubscribed. The claim above keeps
      // the cart from being rescanned forever.
      if (unsubscribed.has(normalizeEmail(cart.email))) {
        stats.skippedUnsubscribed++;
        continue;
      }

      // Safety net on top of markCartRecovered: if an order for this email
      // exists after the cart was last touched, retire the cart instead of
      // nagging a customer who already bought.
      try {
        const { data: order } = await supabase
          .from("orders")
          .select("id")
          .ilike("customer_email", cart.email)
          .gte("created_at", cart.updated_at)
          .limit(1)
          .maybeSingle();
        if (order) {
          stats.markedRecovered++;
          await supabase
            .from("abandoned_carts")
            .update({ recovered_at: new Date().toISOString() })
            .eq("id", cart.id);
          continue;
        }
      } catch (err) {
        // Order check is best-effort — proceed with the reminder.
        console.warn(`[abandoned-carts] order check failed for ${cart.id}:`, err);
      }

      const items = (cart.items as AbandonedCartItem[]) ?? [];
      if (items.length === 0) continue;

      try {
        const html = await render(
          AbandonedCartEmail({
            customerName: cart.customer_name,
            items,
            total: cart.total != null ? Number(cart.total) : null,
            currency: cart.currency,
          }),
        );
        // Resend v6 never throws — inspect { error }.
        const { error: sendError } = await resend.emails.send({
          from,
          to: cart.email,
          subject: "Dejaste algo en tu carrito — FLOW",
          html,
        });
        if (sendError) {
          stats.failed++;
          console.error(
            `[abandoned-carts] reminder send failed for ${cart.email}:`,
            sendError,
          );
        } else {
          stats.sent++;
        }
      } catch (err) {
        // Network/render errors can still throw. The claim stays set so a
        // flapping mailbox can't be spammed on every cron run.
        stats.failed++;
        console.error(`[abandoned-carts] reminder send threw for ${cart.email}:`, err);
      }
    }

    return stats;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[abandoned-carts] sendAbandonedCartReminders unexpected error:", err);
    return { ...stats, error: message };
  }
}

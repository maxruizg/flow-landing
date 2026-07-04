import type Stripe from "stripe";
import { render } from "@react-email/render";
import { stripe } from "~/lib/stripe.server";
import {
  createNotification,
  createOrder,
  createOrUpdateCustomer,
  decrementVariantStock,
  getEmailSettings,
  getOrderByStripeSession,
} from "~/data/queries.server";
import { getResend } from "~/lib/resend.server";
import { markCartRecovered } from "~/lib/abandoned-carts.server";
import { OrderConfirmationEmail } from "~/emails/order-confirmation";

export interface WebhookOrderItem {
  productId?: string;
  variantId?: string | null;
  productName: string;
  colorName?: string | null;
  size: string;
  quantity: number;
  price: number;
}

interface EnsureOrderResult {
  orderId: string;
  created: boolean;
}

/**
 * Idempotent: safe to call from both the Stripe webhook and the checkout
 * success loader. Creates the order row, decrements variant stock, upserts
 * the customer, and sends the confirmation email — only when the order row
 * doesn't already exist for this stripeSessionId.
 */
export async function ensureOrderFromPaymentIntent(
  pi: Stripe.PaymentIntent,
): Promise<EnsureOrderResult | null> {
  if (pi.status !== "succeeded") return null;

  const existing = await getOrderByStripeSession(pi.id);
  if (existing) {
    return { orderId: existing.id, created: false };
  }

  const metadata = pi.metadata || {};
  const items: WebhookOrderItem[] = safeParseItems(metadata);
  const currency = metadata.currency || pi.currency || "usd";

  const customerName = pi.shipping?.name || metadata.customer_name || "Unknown";
  const customerEmail = pi.receipt_email || metadata.customer_email || "";
  const shippingAddress = pi.shipping?.address
    ? JSON.stringify(pi.shipping.address)
    : metadata.shipping_address || "{}";

  const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
  const total = pi.amount / 100;

  // Create the order row FIRST — the unique index on orders(stripe_session_id)
  // is the atomic gate that serializes concurrent callers (webhook + success
  // loader fallback). Only the caller that wins the insert runs the side
  // effects — otherwise stock and customer stats would double-count.
  try {
    await createOrder({
      id: orderId,
      customerName,
      customerEmail,
      items,
      total,
      currency,
      shippingAddress,
      stripeSessionId: pi.id,
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      // Another writer won the race — fetch and return their order.
      const winner = await getOrderByStripeSession(pi.id).catch(() => null);
      if (winner) return { orderId: winner.id, created: false };
    }
    // Genuine (likely transient) failure: return null so the webhook can
    // respond 500 and Stripe retries the event.
    console.error(`[orders] createOrder failed for ${pi.id}:`, err);
    return null;
  }

  // We're the single winner → safe to run side effects exactly once.
  await decrementStockForItems(items);

  // Fire-and-forget: the customer bought, so retire any abandoned-cart row
  // before the recovery cron could email them. Never throws.
  if (customerEmail) void markCartRecovered(customerEmail);

  let customerIsNew = false;
  try {
    const result = await createOrUpdateCustomer({ name: customerName, email: customerEmail, orderTotal: total });
    customerIsNew = result.isNew;
  } catch (err) {
    console.error(`[orders] createOrUpdateCustomer failed for ${pi.id}:`, err);
  }

  await emitOrderNotifications({ orderId, customerName, total, currency, itemCount: items.length, customerIsNew });

  if (customerEmail) {
    try {
      await sendOrderConfirmation(customerEmail, customerName, orderId, items, total, currency);
    } catch (err) {
      console.error(`[orders] sendOrderConfirmation failed for ${pi.id}:`, err);
    }
  }

  return { orderId, created: true };
}

/** Idempotent variant of ensureOrderFromPaymentIntent for Checkout Sessions. */
export async function ensureOrderFromCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<EnsureOrderResult | null> {
  if (session.payment_status !== "paid") return null;

  const existing = await getOrderByStripeSession(session.id);
  if (existing) return { orderId: existing.id, created: false };

  const metadata = session.metadata || {};
  const items: WebhookOrderItem[] = safeParseItems(metadata);
  const currency = metadata.currency || session.currency || "usd";
  const shippingAddress = metadata.shipping_address || "{}";
  const customerName = metadata.customer_name || "Unknown";
  const customerEmail = metadata.customer_email || session.customer_email || "";
  const total = (session.amount_total || 0) / 100;

  const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
  try {
    await createOrder({
      id: orderId,
      customerName,
      customerEmail,
      items,
      total,
      currency,
      shippingAddress,
      stripeSessionId: session.id,
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      // Race: another caller already processed this session — don't double-run
      // stock / customer side effects.
      const winner = await getOrderByStripeSession(session.id).catch(() => null);
      if (winner) return { orderId: winner.id, created: false };
    }
    console.error(`[orders] createOrder failed for session ${session.id}:`, err);
    return null;
  }

  await decrementStockForItems(items);

  // Fire-and-forget: retire any abandoned-cart row for this buyer. Never throws.
  if (customerEmail) void markCartRecovered(customerEmail);

  let customerIsNew = false;
  try {
    const result = await createOrUpdateCustomer({ name: customerName, email: customerEmail, orderTotal: total });
    customerIsNew = result.isNew;
  } catch (err) {
    console.error(`[orders] createOrUpdateCustomer failed for session ${session.id}:`, err);
  }

  await emitOrderNotifications({ orderId, customerName, total, currency, itemCount: items.length, customerIsNew });

  if (customerEmail) {
    try {
      await sendOrderConfirmation(customerEmail, customerName, orderId, items, total, currency);
    } catch (err) {
      console.error(`[orders] sendOrderConfirmation failed for session ${session.id}:`, err);
    }
  }

  return { orderId, created: true };
}

/**
 * Convenience wrapper: retrieves the PaymentIntent from Stripe and ensures
 * the order exists. Used as a fallback from the checkout success loader in
 * case the webhook hasn't fired yet (or isn't configured in this env).
 */
export async function ensureOrderFromPaymentIntentId(
  paymentIntentId: string,
): Promise<EnsureOrderResult | null> {
  try {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    return await ensureOrderFromPaymentIntent(pi);
  } catch (err) {
    console.error(`[orders] ensureOrderFromPaymentIntentId failed for ${paymentIntentId}:`, err);
    return null;
  }
}

/**
 * Surfaces a failed/expired PaymentIntent to the admin as a notification.
 * Fired from the payment_intent.payment_failed webhook — for OXXO this means
 * the customer never paid the voucher before it expired (no order row exists
 * yet, since orders are only created on payment_intent.succeeded), so there
 * is nothing to cancel; we just leave a trace for follow-up. Never throws.
 */
export async function notifyPaymentFailed(pi: Stripe.PaymentIntent): Promise<void> {
  const methodType = pi.last_payment_error?.payment_method?.type ?? null;
  const isOxxo = methodType === "oxxo";
  const email = pi.receipt_email || pi.metadata?.customer_email || "unknown email";
  const amount = formatAmount(pi.amount / 100, pi.currency);
  const reason = isOxxo
    ? "OXXO voucher expired without payment"
    : pi.last_payment_error?.message || "payment failed";

  try {
    await createNotification({
      type: "system",
      title: isOxxo ? "OXXO voucher expired" : "Payment failed",
      message: `${pi.id} · ${amount} · ${email} · ${reason}`,
      linkTo: "/admin/orders",
    });
  } catch (err) {
    console.error(`[orders] payment-failed notification failed for ${pi.id}:`, err);
  }
}

// ───────────────────────────────────────────────────────────────────────────

/** Postgres 23505 = unique_violation. Supabase surfaces it as a PostgrestError
 *  with `.code`. Seeing it on orders(stripe_session_id) means another writer
 *  (webhook vs. success loader) already created the order — not a failure. */
function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: unknown }).code === "23505"
  );
}

async function decrementStockForItems(items: WebhookOrderItem[]): Promise<void> {
  for (const it of items) {
    if (!it.variantId) {
      console.warn(`[orders] skipping stock decrement — missing variantId for "${it.productName}" (${it.size})`);
      continue;
    }
    try {
      const result = await decrementVariantStock(it.variantId, it.size, it.quantity);
      if (result && result.nextStock === 0) {
        const label = it.colorName
          ? `${it.productName} — ${it.colorName} (${it.size})`
          : `${it.productName} (${it.size})`;
        await createNotification({
          type: "stock",
          title: "Out of stock",
          message: `${label} is now out of stock after the latest order.`,
          linkTo: "/admin/products",
        });
      }
    } catch (err) {
      console.error(`[orders] decrementVariantStock failed for ${it.variantId} (${it.size}):`, err);
    }
  }
}

async function emitOrderNotifications(input: {
  orderId: string;
  customerName: string;
  total: number;
  currency: string;
  itemCount: number;
  customerIsNew: boolean;
}): Promise<void> {
  const { orderId, customerName, total, currency, itemCount, customerIsNew } = input;
  const amount = formatAmount(total, currency);
  const itemWord = itemCount === 1 ? "item" : "items";

  try {
    await createNotification({
      type: "order",
      title: `New order ${orderId}`,
      message: `${customerName} · ${itemCount} ${itemWord} · ${amount}`,
      linkTo: "/admin/orders",
    });
  } catch (err) {
    console.error(`[orders] order notification failed for ${orderId}:`, err);
  }

  if (customerIsNew) {
    try {
      await createNotification({
        type: "customer",
        title: "New customer",
        message: `${customerName} just placed their first order.`,
        linkTo: "/admin/customers",
      });
    } catch (err) {
      console.error(`[orders] customer notification failed for ${orderId}:`, err);
    }
  }
}

function formatAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (currency || "usd").toUpperCase(),
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency?.toUpperCase() || ""}`.trim();
  }
}

/**
 * Reassemble the items JSON from metadata. Stripe caps each value at 500 chars,
 * so the PI creation endpoint chunks long payloads into `items_json_0`,
 * `items_json_1`, ... We read chunks in order; we also fall back to the legacy
 * single `items_json` key so any in-flight pre-migration orders still work.
 */
function safeParseItems(metadata: Record<string, string>): WebhookOrderItem[] {
  const raw = joinChunkedMetadata(metadata, "items_json") ?? metadata.items_json;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function joinChunkedMetadata(
  metadata: Record<string, string>,
  prefix: string,
): string | null {
  if (metadata[`${prefix}_0`] === undefined) return null;
  let joined = "";
  for (let i = 0; ; i++) {
    const chunk = metadata[`${prefix}_${i}`];
    if (chunk === undefined) break;
    joined += chunk;
  }
  return joined;
}

async function sendOrderConfirmation(
  email: string,
  customerName: string,
  orderId: string,
  items: WebhookOrderItem[],
  total: number,
  currency: string,
): Promise<void> {
  const settings = await getEmailSettings("order_confirmation");
  const resend = getResend();
  const emailProps = {
    orderId,
    customerName,
    items,
    total,
    currency,
    subject: settings.subject || undefined,
    headerText: settings.headerText || undefined,
    bodyText: settings.bodyText || undefined,
    heroImage: settings.heroImage || undefined,
    ctaText: settings.ctaText || undefined,
    ctaUrl: settings.ctaUrl || undefined,
  };
  const html = await render(OrderConfirmationEmail(emailProps));
  const text = await render(OrderConfirmationEmail(emailProps), { plainText: true });
  const replyTo = process.env.RESEND_REPLY_TO || "contact@flowurbanwear.com";
  // Resend v6 never throws — failures come back as { error }. Ignoring it
  // means confirmation emails silently vanish. Log + surface an admin
  // notification, but never fail order creation over an email.
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Flow Urban Wear <contact@flowurbanwear.com>",
    to: email,
    subject: settings.subject || "Order Confirmed — FLOW",
    html,
    text,
    replyTo,
  });
  if (error) {
    console.error(`[orders] confirmation email failed for ${orderId} (${email}):`, error);
    await createNotification({
      type: "system",
      title: "Order confirmation email failed",
      message: `Could not send the confirmation for ${orderId} to ${email}: ${error.message ?? error.name ?? "unknown error"}`,
      linkTo: "/admin/orders",
    }).catch(() => {});
  }
}

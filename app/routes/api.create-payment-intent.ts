import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import type Stripe from "stripe";
import { stripe } from "~/lib/stripe.server";
import { shippingFee } from "~/lib/shipping";
import { getVariantsByIds } from "~/data/queries.server";
import { checkRateLimit, getClientIp } from "~/lib/rate-limit.server";
import { upsertAbandonedCart } from "~/lib/abandoned-carts.server";
import type { CartItem } from "~/lib/types";

interface PaymentIntentRequest {
  items: CartItem[];
  currency: "usd" | "mxn";
  /**
   * "capture-cart" → validate + price the cart server-side and upsert an
   * abandoned-cart row, WITHOUT creating a PaymentIntent. Fired by checkout
   * when the shopper continues to the payment step (that's the first moment
   * an email exists — the PI itself is created on page load, before the
   * email is typed).
   */
  intent?: "capture-cart";
  email?: string;
  name?: string;
  locale?: string;
}

// Stripe caps each metadata value at 500 chars but allows 50 keys. Chunk long
// JSON payloads into `<prefix>_0`, `<prefix>_1`, ... so carts of any realistic
// size fit. The reader in app/lib/orders.server.ts mirrors this.
const METADATA_CHUNK_SIZE = 450;

function chunkMetadata(prefix: string, value: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (value.length <= METADATA_CHUNK_SIZE) {
    out[`${prefix}_0`] = value;
    return out;
  }
  for (let i = 0, idx = 0; i < value.length; i += METADATA_CHUNK_SIZE, idx++) {
    out[`${prefix}_${idx}`] = value.slice(i, i + METADATA_CHUNK_SIZE);
  }
  return out;
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  let body: PaymentIntentRequest;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request body" }, { status: 400 });
  }

  // Cart captures use their own rate-limit bucket so they can never consume
  // the payment-intent budget (and vice versa) — the PI path keeps the exact
  // same limits it had before.
  const captureOnly = body.intent === "capture-cart";
  const rlKey = captureOnly
    ? `cart-capture:${getClientIp(request)}`
    : `payment-intent:${getClientIp(request)}`;
  const rl = await checkRateLimit(rlKey, 10, 60);
  if (!rl.allowed) {
    return json(
      { error: "Too many payment attempts — please wait a minute and try again." },
      { status: 429 },
    );
  }

  try {
    const { items, currency } = body;

    if (!items || items.length === 0) {
      return json({ error: "Cart is empty" }, { status: 400 });
    }
    if (currency !== "usd" && currency !== "mxn") {
      return json({ error: "Unsupported currency" }, { status: 400 });
    }

    // ── Server-side pricing. The cart lives in localStorage, so every price
    // the client sends is untrusted. Prices come ONLY from the DB; any item
    // we can't resolve to a variant is rejected.
    for (const item of items) {
      if (!item.variantId || typeof item.variantId !== "string") {
        return json(
          {
            error: `"${item.productName ?? "An item"}" in your cart is outdated. Please remove it and add it again.`,
          },
          { status: 400 },
        );
      }
      if (
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 50 ||
        typeof item.size !== "string" ||
        !item.size
      ) {
        return json({ error: "Invalid item quantity or size" }, { status: 400 });
      }
    }

    const variantIds = Array.from(new Set(items.map((i) => i.variantId as string)));
    const variants = await getVariantsByIds(variantIds);

    // ── Stock validation: aggregate requested qty per variant+size, then
    // compare against the DB size_stock. Report every offending item at once.
    const requested = new Map<string, number>();
    for (const item of items) {
      const key = `${item.variantId}|${item.size}`;
      requested.set(key, (requested.get(key) ?? 0) + item.quantity);
    }

    const missing: string[] = [];
    const outOfStock: string[] = [];
    let subtotal = 0;

    for (const item of items) {
      const variant = variants.get(item.variantId as string);
      const label = [item.productName, item.colorName, `(${item.size})`]
        .filter(Boolean)
        .join(" — ");
      if (!variant) {
        missing.push(label);
        continue;
      }

      let unitPrice: number;
      if (currency === "mxn") {
        // Never fall back to the USD number as pesos — that would charge
        // ~1/17th of the real price. Reject instead.
        if (!variant.priceMxn || variant.priceMxn <= 0) {
          return json(
            {
              error: `"${item.productName}" is not available in MXN right now. Please switch to USD or contact us.`,
            },
            { status: 400 },
          );
        }
        unitPrice = variant.priceMxn;
      } else {
        if (!variant.price || variant.price <= 0) {
          return json(
            { error: `"${item.productName}" is not available for purchase right now.` },
            { status: 400 },
          );
        }
        unitPrice = variant.price;
      }

      const available = variant.sizeStock[item.size] ?? 0;
      const totalRequested = requested.get(`${item.variantId}|${item.size}`) ?? item.quantity;
      if (available < totalRequested) {
        outOfStock.push(`${label}: ${available} left, ${totalRequested} requested`);
      }

      subtotal += unitPrice * item.quantity;
    }

    if (missing.length > 0) {
      return json(
        {
          error: `These items are no longer available: ${missing.join("; ")}. Please remove them from your cart.`,
        },
        { status: 400 },
      );
    }
    if (outOfStock.length > 0) {
      return json(
        { error: `Insufficient stock — ${outOfStock.join("; ")}` },
        { status: 400 },
      );
    }

    const shipping = shippingFee(currency);
    const amount = subtotal + shipping;
    const amountInCents = Math.round(amount * 100);

    // Record the DB-trusted unit price so the order row, the confirmation
    // email and the abandoned-cart snapshot reflect what would actually be
    // charged — never the client-supplied prices.
    const trustedItems = items.map((i) => {
      const variant = variants.get(i.variantId as string)!;
      return {
        productId: i.productId,
        variantId: i.variantId ?? null,
        productName: i.productName,
        colorName: i.colorName ?? null,
        size: i.size,
        quantity: i.quantity,
        price: (currency === "mxn" ? variant.priceMxn : variant.price) ?? 0,
      };
    });

    const customerEmail = typeof body.email === "string" ? body.email.trim() : "";
    const customerName = typeof body.name === "string" ? body.name.trim() : "";
    const customerLocale = typeof body.locale === "string" ? body.locale : null;

    // ── Capture-only mode: persist the cart for abandoned-cart recovery and
    // stop before any Stripe work. upsertAbandonedCart never throws (it fails
    // soft internally), so this can't break the endpoint.
    if (captureOnly) {
      if (customerEmail) {
        await upsertAbandonedCart({
          email: customerEmail,
          name: customerName || null,
          items: trustedItems,
          total: amount,
          currency,
          locale: customerLocale,
        });
      }
      return json({ ok: true });
    }

    if (amountInCents < 50) {
      return json({ error: "Order amount too small" }, { status: 400 });
    }

    const itemsJson = JSON.stringify(trustedItems);

    const metadata = {
      ...chunkMetadata("items_json", itemsJson),
      currency,
      shipping_fee: String(shipping),
      subtotal: String(subtotal),
    };

    // ── Payment method configuration.
    // MXN → card + OXXO (cash voucher) + card installments (Meses Sin
    // Intereses). We enumerate payment_method_types explicitly instead of
    // automatic_payment_methods because Stripe forbids setting
    // payment_method_options[card][installments][enabled] together with
    // dynamic payment methods (docs.stripe.com/payments/mx-installments).
    // USD → card only.
    //
    // OXXO hard limits (docs.stripe.com/payments/oxxo): MXN 10.00 minimum,
    // MXN 10,000.00 maximum. Including "oxxo" on an out-of-range intent makes
    // creation fail outright, so gate it on the amount.
    const OXXO_MIN_CENTS = 1_000; // MXN 10.00
    const OXXO_MAX_CENTS = 1_000_000; // MXN 10,000.00
    const oxxoEligible =
      currency === "mxn" &&
      amountInCents >= OXXO_MIN_CENTS &&
      amountInCents <= OXXO_MAX_CENTS;

    const createParams: Stripe.PaymentIntentCreateParams =
      currency === "mxn"
        ? {
            amount: amountInCents,
            currency,
            payment_method_types: ["card", ...(oxxoEligible ? ["oxxo"] : [])],
            payment_method_options: {
              // Meses Sin Intereses: the Payment Element surfaces the plan
              // selector automatically once an eligible MX credit card is
              // entered. Plans/limits are configured in the Stripe Dashboard.
              card: { installments: { enabled: true } },
            },
            metadata,
          }
        : {
            amount: amountInCents,
            currency,
            payment_method_types: ["card"],
            metadata,
          };

    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create(createParams);
    } catch (err: any) {
      // If the account doesn't have OXXO / installments activated yet (both
      // require a Mexico Stripe account + Dashboard activation), Stripe
      // rejects the explicit configuration. Never let that brick checkout —
      // fall back to the previous dynamic behavior and log loudly so it
      // shows up in monitoring.
      if (err?.type === "StripeInvalidRequestError") {
        console.error(
          "[payment-intent] explicit payment method config rejected, " +
            "falling back to automatic_payment_methods. Activate OXXO/MSI in " +
            "the Stripe Dashboard. Reason:",
          err?.message,
        );
        paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency,
          automatic_payment_methods: { enabled: true },
          metadata,
        });
      } else {
        throw err;
      }
    }

    // Fire-and-forget abandoned-cart capture when the client happened to send
    // an email along with the PI request. Never blocks or fails the response
    // (upsertAbandonedCart swallows all errors internally).
    if (customerEmail) {
      void upsertAbandonedCart({
        email: customerEmail,
        name: customerName || null,
        items: trustedItems,
        total: amount,
        currency,
        locale: customerLocale,
      });
    }

    return json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    console.error("PaymentIntent creation failed:", err);
    return json(
      { error: err?.message || "Failed to initialize payment" },
      { status: 500 }
    );
  }
}

import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { stripe } from "~/lib/stripe.server";
import { shippingFee } from "~/lib/shipping";
import type { CartItem } from "~/lib/types";

interface PaymentIntentRequest {
  items: CartItem[];
  currency: "usd" | "mxn";
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

  try {
    const body: PaymentIntentRequest = await request.json();
    const { items, currency } = body;

    if (!items || items.length === 0) {
      return json({ error: "Cart is empty" }, { status: 400 });
    }

    const subtotal = items.reduce((sum, item) => {
      const unitPrice =
        currency === "mxn" && item.priceMxn
          ? item.priceMxn
          : item.price;
      return sum + unitPrice * item.quantity;
    }, 0);

    const shipping = shippingFee(currency);
    const amount = subtotal + shipping;
    const amountInCents = Math.round(amount * 100);

    if (amountInCents < 50) {
      return json({ error: "Order amount too small" }, { status: 400 });
    }

    const itemsJson = JSON.stringify(
      items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId ?? null,
        productName: i.productName,
        colorName: i.colorName ?? null,
        size: i.size,
        quantity: i.quantity,
        price: currency === "mxn" ? i.priceMxn : i.price,
      })),
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        ...chunkMetadata("items_json", itemsJson),
        currency,
        shipping_fee: String(shipping),
        subtotal: String(subtotal),
      },
    });

    return json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    console.error("PaymentIntent creation failed:", err);
    return json(
      { error: err?.message || "Failed to initialize payment" },
      { status: 500 }
    );
  }
}

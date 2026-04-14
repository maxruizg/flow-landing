import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { stripe } from "~/lib/stripe.server";
import type { CartItem } from "~/lib/types";

interface PaymentIntentRequest {
  items: CartItem[];
  currency: "usd" | "mxn";
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

    const amount = items.reduce((sum, item) => {
      const unitPrice = currency === "mxn" ? item.priceMxn : item.price;
      return sum + unitPrice * item.quantity;
    }, 0);

    const amountInCents = Math.round(amount * 100);

    if (amountInCents < 50) {
      return json({ error: "Order amount too small" }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        items_json: JSON.stringify(
          items.map((i) => ({
            productName: i.productName,
            size: i.size,
            quantity: i.quantity,
            price: currency === "mxn" ? i.priceMxn : i.price,
          }))
        ),
        currency,
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

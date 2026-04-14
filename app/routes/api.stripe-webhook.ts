import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import Stripe from "stripe";
import { stripe } from "~/lib/stripe.server";
import {
  createOrder,
  createOrUpdateCustomer,
} from "~/data/queries.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const metadata = pi.metadata || {};
    const items = JSON.parse(metadata.items_json || "[]");
    const currency = metadata.currency || "usd";

    const customerName = pi.shipping?.name || metadata.customer_name || "Unknown";
    const customerEmail = pi.receipt_email || metadata.customer_email || "";
    const shippingAddress = pi.shipping?.address
      ? JSON.stringify(pi.shipping.address)
      : metadata.shipping_address || "{}";

    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const total = pi.amount / 100;

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

      await createOrUpdateCustomer({
        name: customerName,
        email: customerEmail,
        orderTotal: total,
      });

      console.log(`Order ${orderId} created for PaymentIntent ${pi.id}`);
    } catch (err) {
      console.error("Failed to create order:", err);
      return json({ error: "Order creation failed" }, { status: 500 });
    }
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status !== "paid") {
      return json({ received: true });
    }

    const metadata = session.metadata || {};
    const items = JSON.parse(metadata.items_json || "[]");
    const currency = metadata.currency || "usd";
    const shippingAddress = metadata.shipping_address || "{}";

    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const total = (session.amount_total || 0) / 100;

    try {
      await createOrder({
        id: orderId,
        customerName: metadata.customer_name || "Unknown",
        customerEmail: metadata.customer_email || session.customer_email || "",
        items,
        total,
        currency,
        shippingAddress,
        stripeSessionId: session.id,
      });

      await createOrUpdateCustomer({
        name: metadata.customer_name || "Unknown",
        email: metadata.customer_email || session.customer_email || "",
        orderTotal: total,
      });
    } catch (err) {
      console.error("Failed to create order:", err);
      return json({ error: "Order creation failed" }, { status: 500 });
    }
  }

  return json({ received: true });
}

import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import Stripe from "stripe";
import { stripe } from "~/lib/stripe.server";
import {
  ensureOrderFromCheckoutSession,
  ensureOrderFromPaymentIntent,
} from "~/lib/orders.server";

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
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const result = await ensureOrderFromPaymentIntent(pi);
    if (result && !result.created) {
      return json({ received: true, duplicate: true });
    }
    return json({ received: true, orderId: result?.orderId ?? null });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const result = await ensureOrderFromCheckoutSession(session);
    if (result && !result.created) {
      return json({ received: true, duplicate: true });
    }
    return json({ received: true, orderId: result?.orderId ?? null });
  }

  return json({ received: true });
}

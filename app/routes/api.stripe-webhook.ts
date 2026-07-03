import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import Stripe from "stripe";
import { stripe } from "~/lib/stripe.server";
import {
  ensureOrderFromCheckoutSession,
  ensureOrderFromPaymentIntent,
  notifyPaymentFailed,
} from "~/lib/orders.server";
import { updateOrderStatusByStripeSession } from "~/data/queries.server";

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
    if (!result) {
      // The payment succeeded but the order row could not be created
      // (transient DB failure). Respond 500 so Stripe retries the event —
      // a 200 here would drop the order forever.
      console.error(`[webhook] order creation failed for ${pi.id}, asking Stripe to retry`);
      return json({ error: "Order creation failed, retry" }, { status: 500 });
    }
    return json({ received: true, orderId: result.orderId });
  }

  if (event.type === "payment_intent.payment_failed") {
    // For card payments this is a decline the customer already saw. For OXXO
    // (delayed notification) it fires when the voucher expires unpaid — no
    // order row exists yet (orders are created on payment_intent.succeeded),
    // so there's nothing to roll back; just log + notify the admin. Always
    // respond 200: retrying this event can't change the outcome.
    const pi = event.data.object as Stripe.PaymentIntent;
    const failedMethod = pi.last_payment_error?.payment_method?.type ?? "unknown";
    console.warn(
      `[webhook] payment_intent.payment_failed: ${pi.id} (${pi.currency}, ${failedMethod}): ${
        pi.last_payment_error?.message ?? "no error message"
      }`,
    );
    // Interactive card declines are seen (and usually retried) by the
    // customer in real time — notifying the admin for each would be noise.
    // Async failures (OXXO voucher expired unpaid) are silent, so those get
    // an admin notification.
    if (failedMethod !== "card") {
      await notifyPaymentFailed(pi);
    }
    return json({ received: true });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const result = await ensureOrderFromCheckoutSession(session);
    if (result && !result.created) {
      return json({ received: true, duplicate: true });
    }
    if (!result && session.payment_status === "paid") {
      // Paid session with no order row created — make Stripe retry.
      console.error(`[webhook] order creation failed for session ${session.id}, asking Stripe to retry`);
      return json({ error: "Order creation failed, retry" }, { status: 500 });
    }
    return json({ received: true, orderId: result?.orderId ?? null });
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    // Only a FULL refund cancels the order (charge.refunded flips to true when
    // amount_refunded reaches the full amount). Partial refunds keep it live.
    if (!charge.refunded) {
      return json({ received: true, partial: true });
    }
    const paymentIntentId =
      typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : charge.payment_intent?.id ?? null;
    if (!paymentIntentId) {
      return json({ received: true });
    }
    try {
      // Orders store the PaymentIntent id in stripe_session_id.
      const matched = await updateOrderStatusByStripeSession(paymentIntentId, "cancelled");
      if (!matched) {
        console.warn(`[webhook] charge.refunded: no order found for ${paymentIntentId}`);
      }
      return json({ received: true, cancelled: matched });
    } catch (err) {
      console.error(`[webhook] failed to cancel order for refund ${paymentIntentId}:`, err);
      return json({ error: "Refund handling failed, retry" }, { status: 500 });
    }
  }

  return json({ received: true });
}

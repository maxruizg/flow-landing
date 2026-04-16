import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import Stripe from "stripe";
import { stripe } from "~/lib/stripe.server";
import {
  createOrder,
  createOrUpdateCustomer,
  decrementVariantStock,
  getEmailSettings,
  getOrderByStripeSession,
} from "~/data/queries.server";
import { getResend } from "~/lib/resend.server";
import { render } from "@react-email/render";
import { OrderConfirmationEmail } from "~/emails/order-confirmation";

async function sendOrderConfirmation(
  email: string,
  customerName: string,
  orderId: string,
  items: WebhookOrderItem[],
  total: number,
  currency: string,
) {
  try {
    const settings = await getEmailSettings("order_confirmation");
    const resend = getResend();
    const html = await render(
      OrderConfirmationEmail({
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
      }),
    );
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Flow Urban Wear <contact@flowurbanwear.com>",
      to: email,
      subject: settings.subject || "Order Confirmed — FLOW",
      html,
    });
  } catch (err) {
    console.error("Order confirmation email failed:", err);
  }
}

interface WebhookOrderItem {
  productId?: string;
  variantId?: string | null;
  productName: string;
  colorName?: string | null;
  size: string;
  quantity: number;
  price: number;
}

async function decrementStockForItems(items: WebhookOrderItem[]) {
  for (const it of items) {
    if (!it.variantId) continue;
    try {
      await decrementVariantStock(it.variantId, it.size, it.quantity);
    } catch (err) {
      console.error(`Stock decrement failed for ${it.variantId} (${it.size}):`, err);
    }
  }
}

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

    const existing = await getOrderByStripeSession(pi.id);
    if (existing) {
      console.log(`Order for PaymentIntent ${pi.id} already exists, skipping`);
      return json({ received: true, duplicate: true });
    }

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

      await decrementStockForItems(items as WebhookOrderItem[]);
      if (customerEmail) {
        await sendOrderConfirmation(customerEmail, customerName, orderId, items, total, currency);
      }
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

    const existing = await getOrderByStripeSession(session.id);
    if (existing) {
      console.log(`Order for Checkout Session ${session.id} already exists, skipping`);
      return json({ received: true, duplicate: true });
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
      await decrementStockForItems(items as WebhookOrderItem[]);
      const confirmEmail = metadata.customer_email || session.customer_email || "";
      if (confirmEmail) {
        await sendOrderConfirmation(
          confirmEmail,
          metadata.customer_name || "Customer",
          orderId,
          items,
          total,
          currency,
        );
      }
    } catch (err) {
      console.error("Failed to create order:", err);
      return json({ error: "Order creation failed" }, { status: 500 });
    }
  }

  return json({ received: true });
}

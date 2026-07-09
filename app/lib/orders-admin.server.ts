import { render } from "@react-email/render";
import { supabase } from "~/lib/supabase.server";
import { getResend } from "~/lib/resend.server";
import { OrderShippedEmail } from "~/emails/order-shipped";
import { createNotification, getEmailBrand } from "~/data/queries.server";
import {
  canTransitionOrderStatus,
  isOrderStatus,
  type OrderStatus,
} from "~/lib/order-status";

export type UpdateOrderStatusResult =
  | { ok: true; previousStatus: OrderStatus; warning?: string }
  | { ok: false; error: string };

/** Postgres error code for "column does not exist" — the tracking migration
 *  hasn't been applied yet. */
const UNDEFINED_COLUMN = "42703";

interface OrderRow {
  id: string;
  status: string;
  customer_name: string;
  customer_email: string | null;
  items: Array<{
    productName: string;
    colorName?: string | null;
    size: string;
    quantity: number;
    price: number;
  }> | null;
}

/**
 * Updates an order's status, validating the transition and guarding against
 * concurrent modification with a compare-and-set on the current status.
 *
 * On the processing → shipped transition it also persists the (optional)
 * tracking number + shipped_at timestamp and sends the customer a shipping
 * confirmation email. Email failures never fail the status update — they
 * come back as a non-blocking `warning`.
 */
export async function updateOrderStatus(
  orderId: string,
  nextStatus: OrderStatus,
  options: { trackingNumber?: string | null } = {},
): Promise<UpdateOrderStatusResult> {
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, status, customer_name, customer_email, items")
    .eq("id", orderId)
    .maybeSingle<OrderRow>();

  if (fetchError) {
    console.error(
      `[orders-admin] Failed to load order ${orderId}:`,
      fetchError,
    );
    return { ok: false, error: "Failed to load order" };
  }
  if (!order) {
    return { ok: false, error: `Order ${orderId} not found` };
  }

  const currentStatus = order.status;
  if (!isOrderStatus(currentStatus)) {
    return {
      ok: false,
      error: `Order has an unknown status: "${currentStatus}"`,
    };
  }
  if (currentStatus === nextStatus) {
    return { ok: false, error: `Order is already ${nextStatus}` };
  }
  if (!canTransitionOrderStatus(currentStatus, nextStatus)) {
    return {
      ok: false,
      error: `Cannot change status from "${currentStatus}" to "${nextStatus}"`,
    };
  }

  const isShipping = nextStatus === "shipped";
  const trackingNumber = options.trackingNumber?.trim() || null;

  // On shipping, persist tracking metadata alongside the status change.
  const shippingPayload: Record<string, unknown> = isShipping
    ? {
        status: nextStatus,
        tracking_number: trackingNumber,
        shipped_at: new Date().toISOString(),
      }
    : { status: nextStatus };

  let { data: updated, error: updateError } = await supabase
    .from("orders")
    .update(shippingPayload)
    .eq("id", orderId)
    .eq("status", currentStatus)
    .select("id");

  // If the tracking migration hasn't been applied yet, the update fails with
  // 42703 (undefined column). Degrade gracefully: warn and retry with only
  // the status change so admins aren't blocked on a pending migration.
  if (updateError && isShipping && updateError.code === UNDEFINED_COLUMN) {
    console.warn(
      `[orders-admin] tracking columns missing (migration 2026-07-02-orders-tracking.sql not applied) — updating order ${orderId} status only`,
    );
    ({ data: updated, error: updateError } = await supabase
      .from("orders")
      .update({ status: nextStatus })
      .eq("id", orderId)
      .eq("status", currentStatus)
      .select("id"));
  }

  if (updateError) {
    console.error(
      `[orders-admin] Failed to update order ${orderId}:`,
      updateError,
    );
    return { ok: false, error: "Failed to update order status" };
  }
  if (!updated || updated.length === 0) {
    return {
      ok: false,
      error: "Order was changed by someone else — refresh and try again",
    };
  }

  let warning: string | undefined;
  if (isShipping) {
    warning = await sendOrderShippedEmail(order, trackingNumber);
  }

  return { ok: true, previousStatus: currentStatus, warning };
}

/**
 * Sends the shipping-confirmation email for an order that just transitioned
 * to "shipped". Never throws; returns a human-readable warning when the email
 * could not be sent (the status update itself already succeeded).
 */
async function sendOrderShippedEmail(
  order: OrderRow,
  trackingNumber: string | null,
): Promise<string | undefined> {
  const email = order.customer_email?.trim();
  if (!email) {
    console.warn(
      `[orders-admin] order ${order.id} has no customer email — skipping shipping confirmation`,
    );
    return "Status updated, but the order has no customer email — no shipping confirmation sent.";
  }
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      `[orders-admin] RESEND_API_KEY is not set — skipping shipping confirmation for ${order.id}`,
    );
    return "Status updated, but RESEND_API_KEY is not configured — no shipping confirmation sent.";
  }

  try {
    const resend = getResend();
    const brand = await getEmailBrand();
    const emailProps = {
      orderId: order.id,
      customerName: order.customer_name || "cliente",
      items: Array.isArray(order.items) ? order.items : [],
      trackingNumber,
      carrier: "DHL",
      // Shared brand base.
      accent: brand.accent,
      logoImage: brand.logoImage,
      backgroundImage: brand.backgroundImage,
      footerTagline: brand.footerTagline,
    };
    const html = await render(OrderShippedEmail(emailProps));
    const text = await render(OrderShippedEmail(emailProps), {
      plainText: true,
    });
    const replyTo = process.env.RESEND_REPLY_TO || "contact@flowurbanwear.com";

    // Resend v6 never throws — failures come back as { error }.
    const { error } = await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL ||
        "Flow Urban Wear <contact@flowurbanwear.com>",
      to: email,
      subject: `¡Tu pedido va en camino! — FLOW (${order.id})`,
      html,
      text,
      replyTo,
    });

    if (error) {
      console.error(
        `[orders-admin] shipping confirmation email failed for ${order.id} (${email}):`,
        error,
      );
      await createNotification({
        type: "system",
        title: "Shipping confirmation email failed",
        message: `Could not send the shipping confirmation for ${order.id} to ${email}: ${error.message ?? error.name ?? "unknown error"}`,
        linkTo: "/admin/orders",
      }).catch(() => {});
      return "Status updated, but the shipping confirmation email failed to send.";
    }
  } catch (err) {
    // Rendering or unexpected failures must never undo the status update.
    console.error(
      `[orders-admin] unexpected error sending shipping confirmation for ${order.id}:`,
      err,
    );
    return "Status updated, but the shipping confirmation email failed to send.";
  }

  return undefined;
}

import { json, redirect } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { stripe } from "~/lib/stripe.server";
import { getOrderByStripeSession } from "~/data/queries.server";
import {
  ensureOrderFromCheckoutSession,
  ensureOrderFromPaymentIntent,
} from "~/lib/orders.server";
import { useCart } from "~/context/CartContext";
import { Navbar } from "~/components/layout/Navbar";
import { useLocale } from "~/context/LocaleContext";
import { trackPurchase } from "~/lib/analytics";

export const meta: MetaFunction = () => [
  { title: "Order Confirmed — FLOW Urban Wear" },
  { name: "robots", content: "noindex" },
];

interface OrderSummaryItem {
  productName: string;
  colorName?: string | null;
  size: string;
  quantity: number;
  price: number;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const paymentIntentId = url.searchParams.get("payment_intent");
  const sessionId = url.searchParams.get("session_id");
  const redirectStatus = url.searchParams.get("redirect_status");

  const id = paymentIntentId || sessionId;
  if (!id) {
    return redirect("/checkout");
  }

  // Stripe's return redirect may carry an explicit failure — route to the
  // failure page. "processing" and "requires_action" show a pending screen.
  if (redirectStatus === "failed") {
    return redirect(`/checkout/failed?payment_intent=${paymentIntentId ?? ""}`);
  }
  if (redirectStatus === "processing" || redirectStatus === "requires_action") {
    // Retrieve the PI to distinguish OXXO (cash voucher, pending until the
    // customer pays in store) from a card payment still being verified. The
    // detection is server-side against Stripe — never trust the query string.
    let paymentMethod: "oxxo" | null = null;
    let voucherUrl: string | null = null;
    let email: string | null = null;
    if (paymentIntentId) {
      try {
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
        // If Stripe already reports success (the redirect param was just
        // stale), run the normal verified-success path instead.
        if (pi.status === "succeeded") {
          return redirect(
            `/checkout/success?payment_intent=${pi.id}&redirect_status=succeeded`,
          );
        }
        if (pi.next_action?.type === "oxxo_display_details") {
          paymentMethod = "oxxo";
          voucherUrl = pi.next_action.oxxo_display_details?.hosted_voucher_url ?? null;
        }
        email = pi.receipt_email || null;
      } catch (err) {
        console.error("[checkout.success] PI lookup for pending state failed:", err);
      }
    }
    return json({
      status: "processing" as const,
      paymentMethod,
      voucherUrl,
      email,
      orderId: null,
      items: null as OrderSummaryItem[] | null,
      total: 0,
      currency: "usd",
    });
  }

  let email: string | null = null;
  let paymentStatus: string | null = null;
  let total = 0;
  let currency = "usd";
  let pendingPaymentMethod: "oxxo" | null = null;
  let pendingVoucherUrl: string | null = null;

  try {
    if (paymentIntentId) {
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
      paymentStatus = pi.status;
      email = pi.receipt_email || null;
      total = pi.amount / 100;
      currency = pi.currency;
      if (pi.next_action?.type === "oxxo_display_details") {
        pendingPaymentMethod = "oxxo";
        pendingVoucherUrl =
          pi.next_action.oxxo_display_details?.hosted_voucher_url ?? null;
      }

      // Fallback path: if the webhook hasn't run yet (or isn't configured),
      // create the order + decrement stock synchronously here.
      if (pi.status === "succeeded") {
        await ensureOrderFromPaymentIntent(pi);
      }
    } else if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      paymentStatus = session.payment_status === "paid" ? "succeeded" : session.payment_status;
      email = session.customer_email || session.metadata?.customer_email || null;
      total = (session.amount_total || 0) / 100;
      currency = session.currency || "usd";

      if (session.payment_status === "paid") {
        await ensureOrderFromCheckoutSession(session);
      }
    }
  } catch (err) {
    console.error("[checkout.success] Stripe/order sync failed:", err);
    // We could NOT verify the payment with Stripe. The redirect_status query
    // param is client-controlled, so it must never unlock the confirmed
    // success screen (which also clears the cart). If the URL claims success,
    // show the neutral "processing / confirming" state instead — the webhook
    // will reconcile the order, and the cart stays intact.
    if (redirectStatus === "succeeded") {
      return json({
        status: "processing" as const,
        paymentMethod: null as "oxxo" | null,
        voucherUrl: null as string | null,
        email: null,
        orderId: null,
        items: null as OrderSummaryItem[] | null,
        total: 0,
        currency: "usd",
      });
    }
    return json({
      status: "error" as const,
      email: null,
      orderId: null,
      items: null as OrderSummaryItem[] | null,
      total: 0,
      currency: "usd",
    });
  }

  if (paymentStatus === "processing" || paymentStatus === "requires_action") {
    return json({
      status: "processing" as const,
      paymentMethod: pendingPaymentMethod,
      voucherUrl: pendingVoucherUrl,
      email,
      orderId: null,
      items: null as OrderSummaryItem[] | null,
      total,
      currency,
    });
  }

  // Only a Stripe-verified status can unlock the confirmed-success screen —
  // never the client-controlled redirect_status param.
  if (paymentStatus !== "succeeded" && paymentStatus !== "paid") {
    return redirect(`/checkout/failed?payment_intent=${paymentIntentId ?? ""}`);
  }

  const order = await getOrderByStripeSession(id).catch(() => null);
  const items = (order?.items ?? null) as OrderSummaryItem[] | null;

  return json({
    status: "paid" as const,
    email,
    orderId: order?.id || null,
    items,
    total: order?.total ?? total,
    currency,
  });
}

function ClearCartOnMount() {
  const { clearCart } = useCart();
  useEffect(() => {
    clearCart();
  }, [clearCart]);
  return null;
}

interface PurchaseTrackerItem {
  productName: string;
  colorName?: string | null;
  size: string;
  quantity: number;
  price: number;
}

/**
 * Fires the GA4 purchase event exactly once per transaction. Deduplication
 * lives in trackPurchase() via sessionStorage, so a refresh of the success
 * page won't double-count revenue.
 */
function PurchaseTracker({
  transactionId,
  items,
  total,
  currency,
}: {
  transactionId: string;
  items: PurchaseTrackerItem[] | null;
  total: number;
  currency: string;
}) {
  useEffect(() => {
    if (!transactionId) return;
    trackPurchase({
      transactionId,
      currency: currency.toUpperCase(),
      value: total,
      items: (items ?? []).map((it, idx) => ({
        item_id: `${transactionId}:${idx}`,
        item_name: it.productName,
        item_variant: it.colorName ?? undefined,
        price: it.price,
        quantity: it.quantity,
      })),
    });
  }, [transactionId, items, total, currency]);
  return null;
}

function AutoRedirect({ to, seconds }: { to: string; seconds: number }) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(interval);
          window.location.href = to;
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [to]);
  return (
    <p className="text-center text-[11px] text-flow-600 mt-6 uppercase tracking-wider">
      Redirecting to the shop in {remaining}s
    </p>
  );
}

export default function CheckoutSuccess() {
  const data = useLoaderData<typeof loader>();
  const { formatLocalPrice, language } = useLocale();

  if (data.status === "processing") {
    const isOxxo = data.paymentMethod === "oxxo";

    if (isOxxo) {
      const es = language !== "en";
      return (
        <div id="main-content" className="min-h-screen bg-flow-black">
          <Navbar />
          {/* OXXO: the customer already holds a live payment voucher, so the
              purchase intent is committed. OXXO payments can't be refunded —
              keeping the cart would invite a second checkout and a double
              charge. Clearing it here is safe because this branch only renders
              after the loader verified the voucher against Stripe server-side
              (never from the client-controlled redirect_status param). */}
          <ClearCartOnMount />
          <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full text-center">
              <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-8">
                <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="font-display text-2xl font-bold text-white mb-3">
                {es ? "Tu voucher OXXO está listo" : "Your OXXO voucher is ready"}
              </h1>
              <p className="text-flow-400 text-sm mb-4">
                {es ? (
                  <>
                    Paga en efectivo en cualquier tienda OXXO mostrando el
                    voucher. Tu pedido se confirmará automáticamente cuando
                    pagues — la confirmación puede tardar hasta 1 día hábil.
                  </>
                ) : (
                  <>
                    Pay in cash at any OXXO store using your voucher. Your
                    order is confirmed automatically once you pay — it can take
                    up to 1 business day to register.
                  </>
                )}
              </p>
              <p className="text-flow-500 text-xs mb-8">
                {es
                  ? "Te enviaremos un correo de confirmación en cuanto recibamos tu pago."
                  : "We'll email your order confirmation as soon as we receive your payment."}
                {data.email ? (
                  <>
                    {" "}
                    <span className="text-flow-300">{data.email}</span>
                  </>
                ) : null}
              </p>
              <div className="space-y-3">
                {data.voucherUrl && (
                  <a
                    href={data.voucherUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full px-6 py-3 bg-white text-flow-black font-display font-semibold text-sm uppercase tracking-wide rounded-full hover:bg-flow-200 transition-colors"
                  >
                    {es ? "Ver mi voucher OXXO" : "View my OXXO voucher"}
                  </a>
                )}
                <Link
                  to="/showroom"
                  className="inline-flex items-center px-6 py-3 border border-flow-700 text-flow-300 font-display font-medium text-sm uppercase tracking-wide rounded-full hover:border-flow-500 hover:text-white transition-colors"
                >
                  {es ? "Seguir comprando" : "Continue Shopping"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div id="main-content" className="min-h-screen bg-flow-black">
        <Navbar />
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto mb-8">
              <svg className="w-10 h-10 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-white mb-3">Processing your payment</h1>
            <p className="text-flow-400 text-sm mb-8">
              Your bank is verifying the transaction. You'll receive an email once it's confirmed — feel free to close this window.
            </p>
            <Link
              to="/showroom"
              className="inline-flex items-center px-6 py-3 border border-flow-700 text-flow-300 font-display font-medium text-sm uppercase tracking-wide rounded-full hover:border-flow-500 hover:text-white transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (data.status !== "paid") {
    return (
      <div id="main-content" className="min-h-screen bg-flow-black">
        <Navbar />
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto mb-8">
              <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-white mb-3">Payment Not Confirmed</h1>
            <p className="text-flow-400 text-sm mb-8">
              We couldn't verify your payment. If you were charged, please reach out and we'll sort it out.
            </p>
            <div className="space-y-3">
              <Link
                to="/checkout"
                className="block w-full px-6 py-3 bg-white text-flow-black font-display font-semibold text-sm uppercase tracking-wide rounded-full hover:bg-flow-200 transition-colors"
              >
                Try Again
              </Link>
              <a
                href="mailto:contact@flowurbanwear.com"
                className="block text-xs text-flow-500 hover:text-white transition-colors"
              >
                contact@flowurbanwear.com
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { email, orderId, items, total, currency } = data;
  const currencySymbol = currency === "mxn" ? "MX$" : "$";

  return (
    <div id="main-content" className="min-h-screen bg-flow-black">
      <Navbar />
      <ClearCartOnMount />
      {orderId && (
        <PurchaseTracker
          transactionId={orderId}
          items={items}
          total={total}
          currency={currency}
        />
      )}
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
          className="max-w-lg w-full"
        >
          {/* Success icon — FLOW wave in green */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 180, damping: 14 }}
              className="absolute inset-0 rounded-full bg-gradient-to-br from-green-500/30 to-green-600/10 border border-green-500/40 flex items-center justify-center"
            >
              <div
                className="w-14 h-14 bg-green-400"
                style={{
                  maskImage: "url('/images/logo/flow-wave-icon.png')",
                  WebkitMaskImage: "url('/images/logo/flow-wave-icon.png')",
                  maskSize: "contain",
                  WebkitMaskSize: "contain",
                  maskRepeat: "no-repeat",
                  WebkitMaskRepeat: "no-repeat",
                  maskPosition: "center",
                  WebkitMaskPosition: "center",
                  maskMode: "luminance",
                  WebkitMaskMode: "luminance",
                } as React.CSSProperties}
              />
            </motion.div>
            {/* Burst dots */}
            {[0, 60, 120, 180, 240, 300].map((angle, i) => (
              <motion.span
                key={i}
                className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-green-400"
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos((angle * Math.PI) / 180) * 60,
                  y: Math.sin((angle * Math.PI) / 180) * 60,
                }}
                transition={{ delay: 0.5 + i * 0.03, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                style={{ marginLeft: -3, marginTop: -3 }}
              />
            ))}
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <p className="text-[11px] uppercase tracking-[0.3em] text-green-400 mb-3">
              Payment confirmed
            </p>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-display text-3xl md:text-4xl font-bold text-white mb-3"
            >
              Congratulations — your order is on the way
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-flow-400 text-sm"
            >
              Thank you for your purchase.
              {email ? (
                <>
                  {" "}A confirmation has been sent to{" "}
                  <span className="text-flow-200">{email}</span>.
                </>
              ) : (
                " A confirmation email is on its way."
              )}
            </motion.p>
          </div>

          {/* Order summary card */}
          {(() => {
            const itemsSubtotal =
              items && items.length > 0
                ? items.reduce((sum, it) => sum + it.price * it.quantity, 0)
                : 0;
            const shipping = items && items.length > 0 ? Math.max(0, total - itemsSubtotal) : 0;
            const hasBreakdown = items && items.length > 0;

            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-flow-900 border border-flow-800/50 rounded-2xl p-5 mb-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-flow-500">
                    Order Summary
                  </span>
                  {orderId && (
                    <span className="text-[11px] text-flow-400 font-mono">#{orderId}</span>
                  )}
                </div>

                {/* Articles */}
                {hasBreakdown && (
                  <div className="space-y-3 mb-4">
                    {items.map((item, i) => (
                      <div key={i} className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm text-white font-medium truncate">
                            {item.productName}
                            {item.colorName ? ` — ${item.colorName}` : ""}
                          </p>
                          <p className="text-xs text-flow-500 mt-0.5">
                            Size {item.size} &middot; Qty {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm text-flow-300 tabular-nums shrink-0">
                          {currencySymbol}
                          {(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Subtotal + Shipping */}
                {hasBreakdown && (
                  <div className="pt-3 border-t border-flow-800/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-flow-500">Subtotal</span>
                      <span className="text-sm text-flow-300 tabular-nums">
                        {currencySymbol}
                        {itemsSubtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-flow-500">Shipping</span>
                      <span className="text-sm text-flow-300 tabular-nums">
                        {shipping > 0
                          ? `${currencySymbol}${shipping.toFixed(2)}`
                          : "Free"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="pt-3 mt-2 border-t border-flow-800/50 flex items-center justify-between">
                  <span className="text-sm font-medium text-white">Total</span>
                  <span className="text-lg font-display font-bold text-white tabular-nums">
                    {currencySymbol}
                    {total.toFixed(2)}{" "}
                    <span className="text-xs text-flow-500 font-normal uppercase">
                      {currency}
                    </span>
                  </span>
                </div>
              </motion.div>
            );
          })()}

          {/* What's next */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-3 gap-2 mb-8 text-center"
          >
            {[
              { label: "Confirmed", icon: "M5 13l4 4L19 7", active: true },
              { label: "Preparing", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", active: false },
              { label: "Shipped", icon: "M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0", active: false },
            ].map((step) => (
              <div key={step.label}>
                <div
                  className={
                    "w-10 h-10 rounded-full border flex items-center justify-center mx-auto mb-2 " +
                    (step.active
                      ? "bg-green-500/20 border-green-500/40 text-green-400"
                      : "bg-flow-900 border-flow-800/50 text-flow-600")
                  }
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={step.icon} />
                  </svg>
                </div>
                <p className={"text-[10px] uppercase tracking-wider " + (step.active ? "text-green-400" : "text-flow-600")}>
                  {step.label}
                </p>
              </div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="space-y-3"
          >
            <Link
              to="/showroom"
              className="block w-full text-center bg-white text-flow-black font-display font-semibold text-sm uppercase tracking-wide rounded-full py-3.5 hover:bg-flow-200 transition-colors"
            >
              Continue Shopping
            </Link>
            <p className="text-center text-xs text-flow-600">
              Questions about your order? Reply to the confirmation email or reach us at{" "}
              <a
                href="mailto:contact@flowurbanwear.com"
                className="text-flow-400 hover:text-white transition-colors underline underline-offset-4 decoration-flow-700"
              >
                contact@flowurbanwear.com
              </a>
            </p>
          </motion.div>

          <AutoRedirect to="/showroom" seconds={15} />
        </motion.div>
      </div>
    </div>
  );
}

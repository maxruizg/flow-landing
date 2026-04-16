import { json, redirect } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { stripe } from "~/lib/stripe.server";
import { getOrderByStripeSession } from "~/data/queries.server";
import { useCart } from "~/context/CartContext";
import { Navbar } from "~/components/layout/Navbar";
import { useLocale } from "~/context/LocaleContext";

export const meta: MetaFunction = () => [
  { title: "Order Confirmed — FLOW URBAN WEAR" },
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

  // If Stripe's return redirect says the payment failed, route to the failure page.
  if (redirectStatus && redirectStatus !== "succeeded") {
    if (redirectStatus === "failed") {
      return redirect(`/checkout/failed?payment_intent=${paymentIntentId ?? ""}`);
    }
    // processing / requires_action — show pending screen
    return json({
      status: "processing" as const,
      email: null,
      orderId: null,
      items: null as OrderSummaryItem[] | null,
      total: 0,
      currency: "usd",
    });
  }

  try {
    let email: string | null = null;
    let paymentStatus: string | null = null;
    let total = 0;
    let currency = "usd";

    if (paymentIntentId) {
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
      paymentStatus = pi.status;
      email = pi.receipt_email || null;
      total = pi.amount / 100;
      currency = pi.currency;
    } else if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      paymentStatus = session.payment_status === "paid" ? "succeeded" : session.payment_status;
      email = session.customer_email || session.metadata?.customer_email || null;
      total = (session.amount_total || 0) / 100;
      currency = session.currency || "usd";
    }

    if (paymentStatus === "processing" || paymentStatus === "requires_action") {
      return json({
        status: "processing" as const,
        email,
        orderId: null,
        items: null as OrderSummaryItem[] | null,
        total,
        currency,
      });
    }

    if (paymentStatus !== "succeeded" && paymentStatus !== "paid") {
      return redirect(`/checkout/failed?payment_intent=${paymentIntentId ?? ""}`);
    }

    const order = await getOrderByStripeSession(id);
    const items = (order?.items ?? null) as OrderSummaryItem[] | null;

    return json({
      status: "paid" as const,
      email,
      orderId: order?.id || null,
      items,
      total: order?.total ?? total,
      currency,
    });
  } catch {
    return json({
      status: "error" as const,
      email: null,
      orderId: null,
      items: null as OrderSummaryItem[] | null,
      total: 0,
      currency: "usd",
    });
  }
}

function ClearCartOnMount() {
  const { clearCart } = useCart();
  useEffect(() => {
    clearCart();
  }, [clearCart]);
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
  const { formatLocalPrice } = useLocale();

  if (data.status === "processing") {
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
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
          className="max-w-lg w-full"
        >
          {/* Success icon with burst */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 180, damping: 14 }}
              className="absolute inset-0 rounded-full bg-gradient-to-br from-green-500/30 to-green-600/10 border border-green-500/40 flex items-center justify-center"
            >
              <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
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

            {items && items.length > 0 && (
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

            <div className="pt-3 border-t border-flow-800/50 flex items-center justify-between">
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

import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { motion } from "framer-motion";
import { stripe } from "~/lib/stripe.server";
import { Navbar } from "~/components/layout/Navbar";

export const meta: MetaFunction = () => [
  { title: "Payment Failed — FLOW URBAN WEAR" },
];

interface FailureReason {
  title: string;
  message: string;
  advice: string;
}

const REASON_MAP: Record<string, FailureReason> = {
  card_declined: {
    title: "Your card was declined",
    message: "Your bank declined the charge.",
    advice: "Try a different card or contact your bank.",
  },
  insufficient_funds: {
    title: "Insufficient funds",
    message: "Your card does not have enough funds available.",
    advice: "Use a different card or add funds to your account.",
  },
  incorrect_cvc: {
    title: "Incorrect security code",
    message: "The CVC you entered is incorrect.",
    advice: "Double-check the 3- or 4-digit code on the back of your card.",
  },
  expired_card: {
    title: "Card expired",
    message: "This card has expired.",
    advice: "Use a different card.",
  },
  processing_error: {
    title: "Processing error",
    message: "An error occurred while processing your card.",
    advice: "Please try again.",
  },
  authentication_required: {
    title: "Authentication required",
    message: "Your bank needs to verify this purchase.",
    advice: "Try again and complete the verification step from your bank.",
  },
  generic_decline: {
    title: "Payment declined",
    message: "Your payment was declined.",
    advice: "Try a different card or contact your bank for details.",
  },
};

function reasonFor(code: string | null | undefined, message: string | null | undefined): FailureReason {
  if (code && REASON_MAP[code]) return REASON_MAP[code];
  if (message) {
    return {
      title: "Payment failed",
      message,
      advice: "Try again or use a different payment method.",
    };
  }
  return REASON_MAP.generic_decline;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const paymentIntentId = url.searchParams.get("payment_intent");

  if (!paymentIntentId) {
    return json({
      reason: reasonFor(null, null),
      status: "unknown" as string,
    });
  }

  try {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    const lastError = pi.last_payment_error;
    return json({
      reason: reasonFor(lastError?.decline_code ?? lastError?.code ?? null, lastError?.message ?? null),
      status: pi.status,
    });
  } catch {
    return json({
      reason: reasonFor(null, null),
      status: "error" as string,
    });
  }
}

export default function CheckoutFailed() {
  const { reason, status } = useLoaderData<typeof loader>();

  return (
    <div id="main-content" className="min-h-screen bg-flow-black">
      <Navbar />
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
          className="max-w-md w-full"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 180, damping: 14 }}
            className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-8"
          >
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 3h.01M5.07 19h13.86a2 2 0 001.74-3l-6.93-12a2 2 0 00-3.48 0l-6.93 12a2 2 0 001.74 3z" />
            </svg>
          </motion.div>

          {/* Content */}
          <div className="text-center mb-8">
            <p className="text-[11px] uppercase tracking-[0.25em] text-red-400 mb-3">
              Payment could not be completed
            </p>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white mb-4">
              {reason.title}
            </h1>
            <p className="text-flow-400 text-sm leading-relaxed mb-2">
              {reason.message}
            </p>
            <p className="text-flow-500 text-sm leading-relaxed">
              {reason.advice}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              to="/checkout"
              className="block w-full text-center bg-white text-flow-black font-display font-semibold text-sm uppercase tracking-wide rounded-full py-3.5 hover:bg-flow-200 transition-colors"
            >
              Try Again
            </Link>
            <Link
              to="/showroom"
              className="block w-full text-center border border-flow-700 text-flow-300 font-display font-medium text-sm uppercase tracking-wide rounded-full py-3.5 hover:border-flow-500 hover:text-white transition-colors"
            >
              Continue Shopping
            </Link>
          </div>

          {/* Help */}
          <p className="text-center text-xs text-flow-600 mt-8">
            Still having trouble?{" "}
            <a
              href="mailto:contact@flowurbanwear.com"
              className="text-flow-400 hover:text-white transition-colors underline underline-offset-4 decoration-flow-700"
            >
              contact@flowurbanwear.com
            </a>
          </p>

          {status && status !== "unknown" && status !== "error" && (
            <p className="text-center text-[10px] text-flow-700 mt-3 uppercase tracking-wider">
              Reference: {status}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

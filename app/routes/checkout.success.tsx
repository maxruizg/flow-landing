import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { useEffect } from "react";
import { stripe } from "~/lib/stripe.server";
import { getOrderByStripeSession } from "~/data/queries.server";
import { useCart } from "~/context/CartContext";

export const meta: MetaFunction = () => [
  { title: "Order Confirmed — FLOW URBAN WEAR" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  // Stripe Elements redirects with payment_intent and payment_intent_client_secret
  const paymentIntentId = url.searchParams.get("payment_intent");
  // Legacy: Checkout Sessions use session_id
  const sessionId = url.searchParams.get("session_id");

  const id = paymentIntentId || sessionId;
  if (!id) {
    return json({ status: "missing" as const, email: null, orderId: null });
  }

  try {
    let email: string | null = null;
    let paymentStatus: string | null = null;

    if (paymentIntentId) {
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
      paymentStatus = pi.status === "succeeded" ? "paid" : pi.status;
      email = pi.receipt_email || null;
    } else if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      paymentStatus = session.payment_status === "paid" ? "paid" : session.payment_status;
      email = session.customer_email || session.metadata?.customer_email || null;
    }

    if (paymentStatus !== "paid" && paymentStatus !== "succeeded") {
      return json({ status: "unpaid" as const, email: null, orderId: null });
    }

    const order = await getOrderByStripeSession(id);

    return json({
      status: "paid" as const,
      email,
      orderId: order?.id || null,
    });
  } catch {
    return json({ status: "error" as const, email: null, orderId: null });
  }
}

function ClearCartOnMount() {
  const { clearCart } = useCart();
  useEffect(() => {
    clearCart();
  }, [clearCart]);
  return null;
}

export default function CheckoutSuccess() {
  const { status, email, orderId } = useLoaderData<typeof loader>();

  if (status !== "paid") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-white mb-3">
            Payment Not Confirmed
          </h1>
          <p className="text-flow-400 text-sm mb-8">
            We couldn't verify your payment. If you were charged, please contact us and we'll sort it out.
          </p>
          <Link
            to="/showroom"
            className="inline-flex items-center px-6 py-3 bg-white text-flow-black font-display font-semibold text-sm rounded-full hover:bg-flow-200 transition-colors"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <ClearCartOnMount />
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-display text-3xl font-bold text-white mb-3">
          Order Confirmed
        </h1>
        {orderId && (
          <p className="text-flow-500 text-xs uppercase tracking-wider mb-4">
            Order {orderId}
          </p>
        )}
        <p className="text-flow-400 text-sm mb-8">
          Thank you for your purchase! We'll send a confirmation
          {email ? (
            <>
              {" "}to <span className="text-flow-200">{email}</span>
            </>
          ) : (
            " email shortly"
          )}
          .
        </p>
        <Link
          to="/showroom"
          className="inline-flex items-center px-6 py-3 bg-white text-flow-black font-display font-semibold text-sm rounded-full hover:bg-flow-200 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

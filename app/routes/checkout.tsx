import { useState, useEffect, useCallback } from "react";
import { Link } from "@remix-run/react";
import type { MetaFunction } from "@remix-run/node";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  AddressElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import type { StripeAddressElementChangeEvent } from "@stripe/stripe-js";
import { useCart } from "~/context/CartContext";
import { useLocale } from "~/context/LocaleContext";
import { Navbar } from "~/components/layout/Navbar";
import { cn } from "~/lib/utils";
import { shippingFee } from "~/lib/shipping";

export const meta: MetaFunction = () => [
  { title: "Checkout — FLOW URBAN WEAR" },
];

let stripePromise: ReturnType<typeof loadStripe> | null = null;
function getStripe() {
  if (!stripePromise && typeof window !== "undefined") {
    const key = (window as any).ENV?.STRIPE_PUBLISHABLE_KEY;
    if (key) {
      stripePromise = loadStripe(key);
    }
  }
  return stripePromise;
}

const stripeAppearance = {
  theme: "night" as const,
  variables: {
    colorPrimary: "#ffffff",
    colorBackground: "#0a0a0a",
    colorText: "#e5e5e5",
    colorDanger: "#ef4444",
    fontFamily: "system-ui, -apple-system, sans-serif",
    borderRadius: "8px",
    colorTextPlaceholder: "#525252",
  },
  rules: {
    ".Input": {
      border: "1px solid #262626",
      backgroundColor: "#0a0a0a",
      padding: "12px 16px",
    },
    ".Input:focus": {
      border: "1px solid #737373",
      boxShadow: "none",
    },
    ".Label": {
      fontSize: "11px",
      fontWeight: "500",
      letterSpacing: "0.2em",
      textTransform: "uppercase" as const,
      color: "#737373",
      marginBottom: "8px",
    },
  },
};

// ─── Step Indicator ───────────────────────────────────────────────
function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-10">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
            step === 1
              ? "bg-white text-flow-black"
              : "bg-green-500/20 text-green-400"
          )}
        >
          {step > 1 ? (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            "1"
          )}
        </div>
        <span
          className={cn(
            "text-xs uppercase tracking-[0.15em] font-medium",
            step === 1 ? "text-white" : "text-green-400"
          )}
        >
          Shipping
        </span>
      </div>

      <div className="w-12 h-px bg-flow-700" />

      <div className="flex items-center gap-2">
        <div
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
            step === 2
              ? "bg-white text-flow-black"
              : "bg-flow-800 text-flow-500"
          )}
        >
          2
        </div>
        <span
          className={cn(
            "text-xs uppercase tracking-[0.15em] font-medium",
            step === 2 ? "text-white" : "text-flow-500"
          )}
        >
          Payment
        </span>
      </div>
    </div>
  );
}

// ─── Checkout Form (inside Elements provider) ─────────────────────
interface ShippingInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: StripeAddressElementChangeEvent["value"]["address"] | null;
}

const inputClass =
  "w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#525252] focus:border-[#737373] focus:outline-none transition-colors";
const labelClass =
  "text-[11px] uppercase tracking-[0.2em] text-[#737373] mb-2 block font-medium";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function CheckoutForm() {
  const stripeHook = useStripe();
  const elements = useElements();
  const { items, subtotal, subtotalMxn } = useCart();
  const { formatLocalPrice, currency } = useLocale();

  const shippingUsd = shippingFee("usd");
  const shippingMxn = shippingFee("mxn");
  const totalUsd = subtotal + shippingUsd;
  const totalMxn = subtotalMxn + shippingMxn;

  const [step, setStep] = useState<1 | 2>(1);
  const [shipping, setShipping] = useState<ShippingInfo>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: null,
  });
  const [addressComplete, setAddressComplete] = useState(false);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  const updateField = (field: keyof ShippingInfo, value: string) => {
    setShipping((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: false }));
    if (error) setError(null);
  };

  const handleAddressChange = useCallback(
    (event: StripeAddressElementChangeEvent) => {
      setAddressComplete(event.complete);
      if (event.complete) {
        setShipping((prev) => ({
          ...prev,
          address: event.value.address,
          firstName: prev.firstName || event.value.name?.split(" ")[0] || "",
          lastName:
            prev.lastName ||
            event.value.name?.split(" ").slice(1).join(" ") ||
            "",
          phone: prev.phone || event.value.phone || "",
        }));
      }
    },
    []
  );

  const validateStep1 = (): boolean => {
    const errors: Record<string, boolean> = {};
    if (!shipping.firstName.trim()) errors.firstName = true;
    if (!shipping.lastName.trim()) errors.lastName = true;
    if (!shipping.email.trim() || !isValidEmail(shipping.email))
      errors.email = true;
    if (!addressComplete) errors.address = true;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const goToStep2 = () => {
    if (!validateStep1()) return;
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePay = async () => {
    if (!stripeHook || !elements) return;
    setLoading(true);
    setError(null);

    const { error: stripeError, paymentIntent } = await stripeHook.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
        receipt_email: shipping.email,
        shipping: shipping.address
          ? {
              name: `${shipping.firstName} ${shipping.lastName}`,
              phone: shipping.phone || undefined,
              address: {
                line1: shipping.address.line1,
                line2: shipping.address.line2 || undefined,
                city: shipping.address.city,
                state: shipping.address.state,
                postal_code: shipping.address.postal_code,
                country: shipping.address.country,
              },
            }
          : undefined,
      },
      redirect: "if_required",
    });

    if (stripeError) {
      setError(
        stripeError.type === "card_error" || stripeError.type === "validation_error"
          ? stripeError.message || "Payment failed"
          : "An unexpected error occurred. Please try again.",
      );
      setLoading(false);
      return;
    }

    // Any resolved paymentIntent → hand off to the success loader, which has
    // the full logic to render success / processing / failure. Passing the
    // real status as redirect_status keeps the server route in control.
    if (paymentIntent) {
      const redirect_status =
        paymentIntent.status === "succeeded"
          ? "succeeded"
          : paymentIntent.status === "processing"
            ? "processing"
            : paymentIntent.status === "requires_action"
              ? "requires_action"
              : "failed";
      const params = new URLSearchParams({
        payment_intent: paymentIntent.id,
        redirect_status,
      });
      window.location.assign(`/checkout/success?${params.toString()}`);
      return;
    }

    // No error and no paymentIntent — Stripe handled a full redirect itself.
    setLoading(false);
  };

  const step1Valid =
    shipping.firstName.trim() &&
    shipping.lastName.trim() &&
    isValidEmail(shipping.email) &&
    addressComplete;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <h1 className="font-display text-3xl font-bold text-white mb-2 text-center">
        Checkout
      </h1>
      <StepIndicator step={step} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Form */}
        <div className="lg:col-span-7">
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xs uppercase tracking-[0.2em] text-flow-400 mb-4 font-display font-medium">
                Contact & Shipping
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>First Name *</label>
                  <input
                    type="text"
                    placeholder="John"
                    value={shipping.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                    className={cn(inputClass, fieldErrors.firstName && "border-red-500")}
                  />
                </div>
                <div>
                  <label className={labelClass}>Last Name *</label>
                  <input
                    type="text"
                    placeholder="Doe"
                    value={shipping.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                    className={cn(inputClass, fieldErrors.lastName && "border-red-500")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Email *</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={shipping.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className={cn(inputClass, fieldErrors.email && "border-red-500")}
                  />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input
                    type="tel"
                    placeholder="+52 55 1234 5678"
                    value={shipping.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Shipping Address *</label>
                {fieldErrors.address && (
                  <p className="text-xs text-red-400 mb-2">
                    Please complete the address
                  </p>
                )}
                <AddressElement
                  options={{
                    mode: "shipping",
                    allowedCountries: ["MX", "US"],
                    fields: { phone: "never" },
                    display: { name: "split" },
                  }}
                  onChange={handleAddressChange}
                />
              </div>

              <button
                onClick={goToStep2}
                disabled={!step1Valid}
                className={cn(
                  "w-full font-display font-semibold text-sm tracking-wide uppercase rounded-full px-6 py-3.5 transition-colors mt-4",
                  step1Valid
                    ? "bg-white text-flow-black hover:bg-flow-200"
                    : "bg-flow-800 text-flow-600 cursor-not-allowed"
                )}
              >
                Continue to Payment
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xs uppercase tracking-[0.2em] text-flow-400 font-display font-medium">
                  Payment
                </h2>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-flow-500 hover:text-white transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Edit Shipping
                </button>
              </div>

              {/* Shipping summary */}
              <div className="bg-flow-950 border border-flow-800/50 rounded-xl p-4">
                <p className="text-xs text-flow-500 uppercase tracking-wider mb-1">Shipping to</p>
                <p className="text-sm text-white">
                  {shipping.firstName} {shipping.lastName}
                </p>
                {shipping.address && (
                  <p className="text-xs text-flow-400 mt-0.5">
                    {shipping.address.line1}
                    {shipping.address.line2 ? `, ${shipping.address.line2}` : ""}
                    , {shipping.address.city}, {shipping.address.state}{" "}
                    {shipping.address.postal_code}, {shipping.address.country}
                  </p>
                )}
              </div>

              {/* Payment Element */}
              <div>
                <PaymentElement
                  options={{
                    layout: "tabs",
                  }}
                />
              </div>

              {/* Billing address toggle */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={billingSameAsShipping}
                    onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden
                    className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                      billingSameAsShipping
                        ? "bg-white border-white"
                        : "border-flow-600 group-hover:border-flow-400",
                    )}
                  >
                    {billingSameAsShipping && (
                      <svg className="w-3 h-3 text-flow-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className="text-sm text-flow-300">
                    Billing address same as shipping
                  </span>
                </label>

                {!billingSameAsShipping && (
                  <div className="pt-2">
                    <label className={labelClass}>Billing Address</label>
                    <AddressElement
                      options={{
                        mode: "billing",
                        allowedCountries: ["MX", "US"],
                        fields: { phone: "never" },
                      }}
                    />
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              <button
                onClick={handlePay}
                disabled={loading || !stripeHook || !elements}
                className={cn(
                  "w-full font-display font-semibold text-sm tracking-wide uppercase rounded-full px-6 py-3.5 transition-colors flex items-center justify-center gap-2",
                  loading
                    ? "bg-flow-800 text-flow-500 cursor-not-allowed"
                    : "bg-white text-flow-black hover:bg-flow-200"
                )}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-flow-600 border-t-flow-black rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Pay {formatLocalPrice(totalUsd, totalMxn)}
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2">
                <svg className="w-3.5 h-3.5 text-flow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-[10px] text-flow-600 uppercase tracking-wider">
                  Secure payment powered by Stripe
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary (always visible) */}
        <div className="lg:col-span-5">
          <div className="bg-flow-950 border border-flow-800/50 rounded-2xl p-6 lg:sticky lg:top-28">
            <h2 className="text-xs uppercase tracking-[0.2em] text-flow-400 mb-5 font-display font-medium">
              Order Summary
            </h2>

            <div className="space-y-3 mb-6">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.size}`}
                  className="flex items-center gap-3"
                >
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-10 h-13 object-cover rounded-lg shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      {item.productName}
                    </p>
                    <p className="text-xs text-flow-500">
                      {item.size} &middot; Qty {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm text-flow-200 shrink-0">
                    {formatLocalPrice(
                      item.price * item.quantity,
                      (item.priceMxn || 0) * item.quantity
                    )}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-flow-800/50 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-flow-500">Subtotal</span>
                <span className="text-flow-200">
                  {formatLocalPrice(subtotal, subtotalMxn)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-flow-500">Shipping</span>
                <span className="text-flow-200">
                  {formatLocalPrice(shippingUsd, shippingMxn)}
                </span>
              </div>
              <div className="flex justify-between text-base font-display font-semibold pt-2 border-t border-flow-800/50">
                <span className="text-white">Total</span>
                <span className="text-white">
                  {formatLocalPrice(totalUsd, totalMxn)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Checkout Page ───────────────────────────────────────────
export default function Checkout() {
  const { items, itemCount } = useCart();
  const { currency } = useLocale();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    if (itemCount === 0) return;

    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items,
        currency: currency.toLowerCase(),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setInitError(data.error || "Could not initialize payment");
        }
      })
      .catch(() => {
        setInitError("Connection error. Please try again.");
      });
  }, [itemCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Empty cart
  if (itemCount === 0) {
    return (
      <div id="main-content">
        <Navbar />
        <div className="min-h-screen flex items-center justify-center px-4 pt-20">
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold text-white mb-3">
              Your cart is empty
            </h1>
            <p className="text-flow-400 text-sm mb-8">
              Add some items before checking out.
            </p>
            <Link
              to="/showroom"
              className="inline-flex items-center px-6 py-3 bg-white text-flow-black font-display font-semibold text-sm rounded-full hover:bg-flow-200 transition-colors"
            >
              Browse Showroom
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Init error
  if (initError) {
    return (
      <div id="main-content">
        <Navbar />
        <div className="min-h-screen flex items-center justify-center px-4 pt-20">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-white mb-3">
              Payment Setup Error
            </h1>
            <p className="text-flow-400 text-sm mb-6">{initError}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-6 py-3 bg-white text-flow-black font-display font-semibold text-sm rounded-full hover:bg-flow-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading
  if (!clientSecret) {
    return (
      <div id="main-content">
        <Navbar />
        <div className="min-h-screen flex items-center justify-center px-4 pt-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-flow-700 border-t-white rounded-full animate-spin" />
            <p className="text-sm text-flow-400">Setting up secure payment...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="main-content">
      <Navbar />
      <Elements
        stripe={getStripe()}
        options={{
          clientSecret,
          appearance: stripeAppearance,
        }}
      >
        <CheckoutForm />
      </Elements>
    </div>
  );
}

import { useState } from "react";
import { Link } from "@remix-run/react";
import type { MetaFunction } from "@remix-run/node";
import { useCart } from "~/context/CartContext";
import { useLocale } from "~/context/LocaleContext";
import { Navbar } from "~/components/layout/Navbar";
import { cn } from "~/lib/utils";

export const meta: MetaFunction = () => [
  { title: "Checkout — FLOW URBAN WEAR" },
];

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

const initialForm: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  zip: "",
  country: "MX",
};

const COUNTRIES = [
  { code: "MX", label: "Mexico" },
  { code: "US", label: "United States" },
];

const inputClass =
  "w-full bg-flow-950 border border-flow-800 rounded-lg px-4 py-3 text-sm text-white placeholder:text-flow-600 focus:border-flow-400 focus:outline-none transition-colors";
const labelClass =
  "text-[11px] uppercase tracking-[0.2em] text-flow-500 mb-2 block";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Checkout() {
  const { items, subtotal, clearCart, itemCount } = useCart();
  const { formatLocalPrice } = useLocale();
  const [form, setForm] = useState<FormData>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, boolean>>>({});

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: false }));
  };

  const validate = (): boolean => {
    const required: (keyof FormData)[] = [
      "firstName",
      "lastName",
      "email",
      "street",
      "city",
      "state",
      "zip",
      "country",
    ];
    const next: Partial<Record<keyof FormData, boolean>> = {};
    for (const key of required) {
      if (!form[key].trim()) next[key] = true;
    }
    if (form.email && !isValidEmail(form.email)) next.email = true;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    clearCart();
    setSubmitted(true);
  };

  const formValid =
    form.firstName.trim() &&
    form.lastName.trim() &&
    isValidEmail(form.email) &&
    form.street.trim() &&
    form.city.trim() &&
    form.state.trim() &&
    form.zip.trim() &&
    form.country.trim();

  // Empty cart guard
  if (itemCount === 0 && !submitted) {
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

  // Order confirmation
  if (submitted) {
    return (
      <div id="main-content">
        <Navbar />
        <div className="min-h-screen flex items-center justify-center px-4 pt-20">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-display text-3xl font-bold text-white mb-3">
              Order Placed
            </h1>
            <p className="text-flow-400 text-sm mb-8">
              Thank you for your order. We'll send a confirmation to{" "}
              <span className="text-flow-200">{form.email}</span>.
            </p>
            <Link
              to="/showroom"
              className="inline-flex items-center px-6 py-3 bg-white text-flow-black font-display font-semibold text-sm rounded-full hover:bg-flow-200 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="main-content">
      <Navbar />
      <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h1 className="font-display text-3xl font-bold text-white mb-10">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Shipping Form */}
          <div className="lg:col-span-7 space-y-5">
            <h2 className="text-xs uppercase tracking-[0.2em] text-flow-400 mb-4 font-display">
              Shipping Information
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>First Name *</label>
                <input
                  type="text"
                  placeholder="John"
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  className={cn(inputClass, errors.firstName && "border-red-500")}
                />
              </div>
              <div>
                <label className={labelClass}>Last Name *</label>
                <input
                  type="text"
                  placeholder="Doe"
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  className={cn(inputClass, errors.lastName && "border-red-500")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Email *</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className={cn(inputClass, errors.email && "border-red-500")}
                />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input
                  type="tel"
                  placeholder="+52 55 1234 5678"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Street Address *</label>
              <input
                type="text"
                placeholder="123 Main St, Apt 4B"
                value={form.street}
                onChange={(e) => update("street", e.target.value)}
                className={cn(inputClass, errors.street && "border-red-500")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>City *</label>
                <input
                  type="text"
                  placeholder="Mexico City"
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  className={cn(inputClass, errors.city && "border-red-500")}
                />
              </div>
              <div>
                <label className={labelClass}>State *</label>
                <input
                  type="text"
                  placeholder="CDMX"
                  value={form.state}
                  onChange={(e) => update("state", e.target.value)}
                  className={cn(inputClass, errors.state && "border-red-500")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>ZIP Code *</label>
                <input
                  type="text"
                  placeholder="06600"
                  value={form.zip}
                  onChange={(e) => update("zip", e.target.value)}
                  className={cn(inputClass, errors.zip && "border-red-500")}
                />
              </div>
              <div>
                <label className={labelClass}>Country *</label>
                <select
                  value={form.country}
                  onChange={(e) => update("country", e.target.value)}
                  className={cn(inputClass, errors.country && "border-red-500")}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-flow-950 border border-flow-800/50 rounded-2xl p-6 lg:sticky lg:top-28">
              <h2 className="text-xs uppercase tracking-[0.2em] text-flow-400 mb-5 font-display">
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
                      {formatLocalPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-flow-800/50 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-flow-500">Subtotal</span>
                  <span className="text-flow-200">
                    {formatLocalPrice(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-flow-500">Shipping</span>
                  <span className="text-flow-200">Free</span>
                </div>
                <div className="flex justify-between text-base font-display font-semibold pt-2 border-t border-flow-800/50">
                  <span className="text-white">Total</span>
                  <span className="text-white">
                    {formatLocalPrice(subtotal)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!formValid}
                className={cn(
                  "w-full mt-6 font-display font-semibold text-sm tracking-wide uppercase rounded-full px-6 py-3.5 transition-colors",
                  formValid
                    ? "bg-white text-flow-black hover:bg-flow-200"
                    : "bg-flow-800 text-flow-600 cursor-not-allowed"
                )}
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

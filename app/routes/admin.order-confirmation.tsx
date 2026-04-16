import { json } from "@remix-run/node";
import { useLoaderData, Form, useNavigation } from "@remix-run/react";
import type { MetaFunction, ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { requireAdmin } from "~/lib/session.server";
import { jsonWithToast } from "~/lib/toast.server";
import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { getEmailSettings, saveEmailSettings } from "~/data/queries.server";
import { uploadImageClient } from "~/lib/supabase.client";

export const meta: MetaFunction = () => [{ title: "FLOW Admin — Order Confirmation Email" }];

const inputClass =
  "w-full bg-flow-950 border border-flow-700 rounded-lg px-4 py-3 text-sm text-flow-100 placeholder:text-flow-500 focus:border-accent-500 focus:outline-none transition-colors";
const labelClass = "block text-xs text-flow-400 mb-1.5 uppercase tracking-wide";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  const settings = await getEmailSettings("order_confirmation");
  return json({ settings });
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAdmin(request);
  const form = await request.formData();
  const settings = {
    subject: (form.get("subject") as string)?.trim() || "Order Confirmed — FLOW",
    headerText: (form.get("headerText") as string)?.trim() || "Thank you for your order",
    bodyText: (form.get("bodyText") as string)?.trim() || "We are processing your order and will notify you when it ships.",
    heroImage: (form.get("heroImage") as string) || "",
    ctaText: (form.get("ctaText") as string)?.trim() || "View Showroom",
    ctaUrl: (form.get("ctaUrl") as string)?.trim() || "https://flowurbanwear.com/showroom",
  };
  await saveEmailSettings("order_confirmation", settings);
  return jsonWithToast(
    { saved: true },
    { type: "success", message: "Order confirmation email saved." },
  );
}

export default function OrderConfirmationSettings() {
  const { settings } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [subject, setSubject] = useState(settings.subject || "Order Confirmed — FLOW");
  const [headerText, setHeaderText] = useState(settings.headerText || "Thank you for your order");
  const [bodyText, setBodyText] = useState(settings.bodyText || "We are processing your order and will notify you when it ships.");
  const [heroImage, setHeroImage] = useState(settings.heroImage || "");
  const [ctaText, setCtaText] = useState(settings.ctaText || "View Showroom");
  const [ctaUrl, setCtaUrl] = useState(settings.ctaUrl || "https://flowurbanwear.com/showroom");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImageClient(file, "campaigns");
      setHeroImage(url);
    } catch (err: any) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="max-w-2xl">
        <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-6">
          <div className="mb-6">
            <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide">
              Order Confirmation Email
            </h2>
            <p className="text-xs text-flow-500 mt-1">
              This email is sent automatically after a successful purchase. Order details (items, total, order ID) are injected dynamically.
            </p>
          </div>

          <Form method="post" className="space-y-4">
            <input type="hidden" name="heroImage" value={heroImage} />

            <div>
              <label className={labelClass}>Subject Line</label>
              <input
                className={inputClass}
                name="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Order Confirmed — FLOW"
              />
            </div>

            <div>
              <label className={labelClass}>Header Text</label>
              <input
                className={inputClass}
                name="headerText"
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                placeholder="Thank you for your order"
              />
              <p className="text-[10px] text-flow-600 mt-1">Main heading in the email body.</p>
            </div>

            <div>
              <label className={labelClass}>Body Text</label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={3}
                name="bodyText"
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder="We are processing your order..."
              />
              <p className="text-[10px] text-flow-600 mt-1">Shown after "Hi [Name]," — the customer name is prepended automatically.</p>
            </div>

            {/* Hero Image */}
            <div>
              <label className={labelClass}>Hero Image</label>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              {heroImage ? (
                <div className="relative group w-full h-40 rounded-lg overflow-hidden bg-flow-950 border border-flow-700">
                  <img src={heroImage} alt="" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {uploading ? (
                      <span className="text-xs text-white uppercase tracking-wide">Uploading…</span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="text-[11px] text-white uppercase tracking-wide bg-black/50 hover:bg-black/80 border border-white/30 rounded px-2.5 py-1"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeroImage("")}
                          className="text-[11px] text-red-400 uppercase tracking-wide bg-black/50 hover:bg-black/80 border border-red-500/30 rounded px-2.5 py-1"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  className="w-full h-28 border-2 border-dashed border-flow-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-accent-500 transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? (
                    <span className="text-xs text-flow-500">Uploading…</span>
                  ) : (
                    <>
                      <svg className="w-6 h-6 text-flow-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-flow-500">Upload hero image (optional)</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>CTA Button Text</label>
                <input
                  className={inputClass}
                  name="ctaText"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="View Showroom"
                />
              </div>
              <div>
                <label className={labelClass}>CTA URL</label>
                <input
                  className={inputClass}
                  name="ctaUrl"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder="https://flowurbanwear.com/showroom"
                  type="url"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-white text-flow-black font-display font-semibold text-sm tracking-wide uppercase rounded-lg px-6 py-3 hover:bg-flow-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </Form>
        </div>

        <div className="bg-flow-900/50 border border-flow-800/30 rounded-xl p-5 mt-4">
          <p className="text-xs text-flow-500 leading-relaxed">
            The order summary (items, sizes, quantities, prices, total) and customer name are injected automatically from the Stripe webhook data. You only configure the branding and messaging above.
          </p>
        </div>
      </div>

    </motion.div>
  );
}

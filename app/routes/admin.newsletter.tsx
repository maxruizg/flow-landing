import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form, useNavigation } from "@remix-run/react";
import type { MetaFunction, ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { requireAdmin } from "~/lib/session.server";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import {
  getActiveSubscribers,
  getSubscriberCount,
  getEmailSettings,
  saveEmailSettings,
} from "~/data/queries.server";
import { getResend } from "~/lib/resend.server";
import { NewDropEmail } from "~/emails/new-drop";
import { uploadImageClient } from "~/lib/supabase.client";

export const meta: MetaFunction = () => [{ title: "FLOW Admin — Newsletter" }];

const inputClass =
  "w-full bg-flow-950 border border-flow-700 rounded-lg px-4 py-3 text-sm text-flow-100 placeholder:text-flow-500 focus:border-accent-500 focus:outline-none transition-colors";
const labelClass = "block text-xs text-flow-400 mb-1.5 uppercase tracking-wide";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  const [subscribers, count, settings] = await Promise.all([
    getActiveSubscribers(),
    getSubscriberCount(),
    getEmailSettings("newsletter"),
  ]);
  return json({ subscribers, count, settings });
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const intent = form.get("intent") as string;

  if (intent === "save") {
    const settings = {
      subject: (form.get("subject") as string)?.trim() || "",
      body: (form.get("body") as string)?.trim() || "",
      heroImage: (form.get("heroImage") as string) || "",
      ctaText: (form.get("ctaText") as string)?.trim() || "Shop Now",
      ctaUrl: (form.get("ctaUrl") as string)?.trim() || "",
    };
    await saveEmailSettings("newsletter", settings);
    return json({ saved: true });
  }

  if (intent === "send") {
    const subject = (form.get("subject") as string)?.trim();
    const body = (form.get("body") as string)?.trim();
    const heroImage = (form.get("heroImage") as string) || "";
    const ctaText = (form.get("ctaText") as string)?.trim() || "Shop Now";
    const ctaUrl = (form.get("ctaUrl") as string)?.trim() || "";

    if (!subject || !body) {
      return json({ error: "Subject and body are required" }, { status: 400 });
    }

    await saveEmailSettings("newsletter", { subject, body, heroImage, ctaText, ctaUrl });

    const subscribers = await getActiveSubscribers();
    if (subscribers.length === 0) {
      return json({ error: "No active subscribers" }, { status: 400 });
    }

    const resend = getResend();
    const emails = subscribers.map((s) => s.email);
    const BATCH_SIZE = 50;

    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE);
      await resend.batch.send(
        batch.map((to) => ({
          from: process.env.RESEND_FROM_EMAIL || "Flow Urban Wear <contact@flowurbanwear.com>",
          to,
          subject,
          react: NewDropEmail({ subject, body, heroImage: heroImage || undefined, ctaText, ctaUrl: ctaUrl || undefined }),
        })),
      );
    }

    return redirect("/admin/newsletter?sent=" + emails.length);
  }

  return json({ error: "Unknown intent" }, { status: 400 });
}

export default function AdminNewsletter() {
  const { subscribers, count, settings } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [subject, setSubject] = useState(settings.subject || "");
  const [body, setBody] = useState(settings.body || "");
  const [heroImage, setHeroImage] = useState(settings.heroImage || "");
  const [ctaText, setCtaText] = useState(settings.ctaText || "Shop Now");
  const [ctaUrl, setCtaUrl] = useState(settings.ctaUrl || "");
  const [uploading, setUploading] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const sentCount = params?.get("sent");

  useEffect(() => {
    if (navigation.state === "idle" && (navigation as any).data?.saved) {
      setSavedToast(true);
      const t = setTimeout(() => setSavedToast(false), 2500);
      return () => clearTimeout(t);
    }
  }, [navigation]);

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
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-5">
          <p className="text-xs text-flow-500 uppercase tracking-wide mb-1">Active Subscribers</p>
          <p className="text-2xl font-display font-bold text-white">{count}</p>
        </div>
        <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-5">
          <p className="text-xs text-flow-500 uppercase tracking-wide mb-1">Status</p>
          <p className="text-sm text-green-400 font-medium mt-1">
            {count > 0 ? "Ready to send" : "No subscribers yet"}
          </p>
        </div>
        <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-5">
          <p className="text-xs text-flow-500 uppercase tracking-wide mb-1">Last Send</p>
          <p className="text-sm text-flow-300 mt-1">
            {sentCount ? `Sent to ${sentCount} subscribers` : "—"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose */}
        <div className="lg:col-span-2">
          <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-6">
            <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide mb-4">
              Compose Newsletter
            </h2>

            {sentCount && (
              <div className="mb-4 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3">
                <p className="text-sm text-green-400">Email sent to {sentCount} subscribers.</p>
              </div>
            )}

            <Form method="post" className="space-y-4">
              <input type="hidden" name="heroImage" value={heroImage} />

              <div>
                <label className={labelClass}>Subject</label>
                <input
                  className={inputClass}
                  name="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="New Drop: Summer Collection"
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Body</label>
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={6}
                  name="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="We just dropped something special..."
                  required
                />
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
                    className="w-full h-32 border-2 border-dashed border-flow-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-accent-500 transition-colors"
                    onClick={() => fileRef.current?.click()}
                  >
                    {uploading ? (
                      <span className="text-xs text-flow-500">Uploading…</span>
                    ) : (
                      <>
                        <svg className="w-6 h-6 text-flow-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-flow-500">Click to upload hero image</span>
                      </>
                    )}
                  </div>
                )}
                <p className="text-[10px] text-flow-600 mt-1">Optional. Displays at the top of the email.</p>
              </div>

              {/* CTA */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>CTA Button Text</label>
                  <input
                    className={inputClass}
                    name="ctaText"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="Shop Now"
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

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  name="intent"
                  value="send"
                  disabled={isSubmitting || count === 0}
                  className="bg-white text-flow-black font-display font-semibold text-sm tracking-wide uppercase rounded-lg px-6 py-3 hover:bg-flow-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Sending..." : `Send to ${count} Subscriber${count !== 1 ? "s" : ""}`}
                </button>
                <button
                  type="submit"
                  name="intent"
                  value="save"
                  disabled={isSubmitting}
                  className="border border-flow-700 text-flow-300 font-display font-semibold text-sm tracking-wide uppercase rounded-lg px-6 py-3 hover:border-flow-500 hover:text-white transition-colors disabled:opacity-50"
                >
                  Save Draft
                </button>
              </div>
            </Form>
          </div>
        </div>

        {/* Subscribers list */}
        <div>
          <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-6">
            <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide mb-4">
              Subscribers
            </h2>
            {subscribers.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {(subscribers as any[]).map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between py-2 border-b border-flow-800/30 last:border-0"
                  >
                    <p className="text-sm text-flow-300 truncate">{sub.email}</p>
                    <span className="text-[10px] text-flow-600 shrink-0 ml-2">
                      {new Date(sub.subscribedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-flow-500 py-4 text-center">
                No subscribers yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {savedToast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 right-6 z-50 bg-green-500/95 text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium">Settings saved</span>
        </motion.div>
      )}
    </motion.div>
  );
}

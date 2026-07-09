import { json } from "@remix-run/node";
import {
  useLoaderData,
  Form,
  useNavigation,
  useFetcher,
} from "@remix-run/react";
import type {
  MetaFunction,
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/node";
import { requireAdmin } from "~/lib/session.server";
import { jsonWithToast } from "~/lib/toast.server";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import {
  getAdminById,
  getEmailSettings,
  saveEmailSettings,
} from "~/data/queries.server";
import { uploadImageClient } from "~/lib/supabase.client";
import { getResend } from "~/lib/resend.server";
import { renderEmailPreview } from "~/lib/email-preview.server";
import {
  PREVIEW_TEMPLATES,
  isPreviewTemplateKey,
  previewSubject,
  type PreviewTemplateKey,
} from "~/lib/email-templates";

export const meta: MetaFunction = () => [
  { title: "FLOW Admin — Email Brand Design" },
];

const inputClass =
  "w-full bg-flow-950 border border-flow-700 rounded-lg px-4 py-3 text-sm text-flow-100 placeholder:text-flow-500 focus:border-accent-500 focus:outline-none transition-colors";
const labelClass = "block text-xs text-flow-400 mb-1.5 uppercase tracking-wide";

const DEFAULT_FOOTER =
  "Flow Urban Wear — Community-based streetwear from Mexico City.";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function loader({ request }: LoaderFunctionArgs) {
  const { adminId } = await requireAdmin(request);
  const [settings, admin] = await Promise.all([
    getEmailSettings("email_brand"),
    adminId ? getAdminById(adminId) : Promise.resolve(null),
  ]);
  return json({ settings, adminEmail: admin?.email ?? "" });
}

export async function action({ request }: ActionFunctionArgs) {
  const { adminId } = await requireAdmin(request);
  const form = await request.formData();
  const intent = (form.get("intent") as string) || "save";

  const settings = {
    accentColor: (form.get("accentColor") as string)?.trim() || "#b8a490",
    logoImage: (form.get("logoImage") as string) || "",
    backgroundImage: (form.get("backgroundImage") as string) || "",
    defaultHeroImage: (form.get("defaultHeroImage") as string) || "",
    footerTagline:
      (form.get("footerTagline") as string)?.trim() || DEFAULT_FOOTER,
    unsubscribeUrl:
      (form.get("unsubscribeUrl") as string)?.trim() ||
      "https://www.flowurbanwear.com/unsubscribe",
  };

  // Shape the current (possibly unsaved) form values as a brand base so the
  // preview/test reflect exactly what the admin is editing right now.
  const brand = {
    accent: settings.accentColor,
    logoImage: settings.logoImage || undefined,
    backgroundImage: settings.backgroundImage || undefined,
    defaultHeroImage: settings.defaultHeroImage || undefined,
    footerTagline: settings.footerTagline,
    unsubscribeUrl: settings.unsubscribeUrl,
  };

  const templateRaw = (form.get("template") as string) || "order_confirmation";
  const template: PreviewTemplateKey = isPreviewTemplateKey(templateRaw)
    ? templateRaw
    : "order_confirmation";

  if (intent === "preview") {
    const html = await renderEmailPreview(template, brand);
    return json({ ok: true, html });
  }

  if (intent === "test") {
    let to = ((form.get("testEmail") as string) || "").trim();
    if (!to && adminId) to = (await getAdminById(adminId))?.email ?? "";
    if (!EMAIL_RE.test(to)) {
      return jsonWithToast(
        { saved: false },
        { type: "error", message: "Ingresa un correo válido para la prueba." },
      );
    }
    try {
      const html = await renderEmailPreview(template, brand);
      const resend = getResend();
      const { error } = await resend.emails.send({
        from:
          process.env.RESEND_FROM_EMAIL ||
          "Flow Urban Wear <contact@flowurbanwear.com>",
        to,
        subject: previewSubject(template),
        html,
      });
      if (error) throw new Error(error.message ?? "Resend error");
      return jsonWithToast(
        { saved: true },
        { type: "success", message: `Prueba enviada a ${to}.` },
      );
    } catch (err: any) {
      console.error("[admin.email-design] test send failed:", err);
      return jsonWithToast(
        { saved: false },
        {
          type: "error",
          message: `No se pudo enviar: ${err?.message || "error desconocido"}`,
        },
      );
    }
  }

  await saveEmailSettings("email_brand", settings);
  return jsonWithToast(
    { saved: true },
    { type: "success", message: "Diseño de correo guardado." },
  );
}

export default function EmailDesignSettings() {
  const { settings, adminEmail } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const previewFetcher = useFetcher<typeof action>();
  const formRef = useRef<HTMLFormElement>(null);

  const [accentColor, setAccentColor] = useState(
    settings.accentColor || "#b8a490",
  );
  const [footerTagline, setFooterTagline] = useState(
    settings.footerTagline || DEFAULT_FOOTER,
  );
  const [unsubscribeUrl, setUnsubscribeUrl] = useState(
    settings.unsubscribeUrl || "https://www.flowurbanwear.com/unsubscribe",
  );
  const [logoImage, setLogoImage] = useState(settings.logoImage || "");
  const [backgroundImage, setBackgroundImage] = useState(
    settings.backgroundImage || "",
  );
  const [defaultHeroImage, setDefaultHeroImage] = useState(
    settings.defaultHeroImage || "",
  );
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const bgRef = useRef<HTMLInputElement>(null);
  const heroRef = useRef<HTMLInputElement>(null);

  // Preview + test controls.
  const [template, setTemplate] = useState<PreviewTemplateKey>(
    "order_confirmation",
  );
  const [testEmail, setTestEmail] = useState(adminEmail || "");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [previewHtml, setPreviewHtml] = useState<string>("");

  const upload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setBusy: (b: boolean) => void,
    setUrl: (u: string) => void,
    ref: React.RefObject<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadImageClient(file, "campaigns");
      setUrl(url);
    } catch (err: any) {
      console.error("Upload failed:", err);
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };

  // Re-render the live preview (debounced) whenever the brand or the selected
  // template changes. Reads the current form values so unsaved edits show up.
  useEffect(() => {
    const id = setTimeout(() => {
      if (!formRef.current) return;
      const fd = new FormData(formRef.current);
      fd.set("intent", "preview");
      previewFetcher.submit(fd, { method: "post" });
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    accentColor,
    logoImage,
    backgroundImage,
    defaultHeroImage,
    footerTagline,
    unsubscribeUrl,
    template,
  ]);

  // Keep the last successfully rendered HTML so the iframe doesn't flash empty.
  useEffect(() => {
    const data = previewFetcher.data;
    if (data && "html" in data && typeof data.html === "string") {
      setPreviewHtml(data.html);
    }
  }, [previewFetcher.data]);

  const previewLoading =
    previewFetcher.state !== "idle" && previewFetcher.formData?.get("intent") === "preview";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="mb-2">
        <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide">
          Email Brand Design
        </h2>
        <p className="text-xs text-flow-500 mt-1">
          The brand base applied to EVERY email — order confirmation, shipped,
          abandoned cart and campaigns. Edit on the left, see it assembled on the
          right, and send yourself a test.
        </p>
      </div>

      <Form
        method="post"
        ref={formRef}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"
      >
        <input type="hidden" name="template" value={template} />

        {/* ── Left: brand fields ── */}
        <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-6 space-y-4">
          <input type="hidden" name="logoImage" value={logoImage} />
          <input
            type="hidden"
            name="backgroundImage"
            value={backgroundImage}
          />
          <input
            type="hidden"
            name="defaultHeroImage"
            value={defaultHeroImage}
          />

          {/* Accent color */}
            <div>
              <label className={labelClass}>Brand Accent Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-11 w-14 rounded-lg bg-flow-950 border border-flow-700 cursor-pointer"
                  aria-label="Accent color picker"
                />
                <input
                  className={inputClass}
                  name="accentColor"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  placeholder="#b8a490"
                />
              </div>
              <p className="text-[10px] text-flow-600 mt-1">
                Used for buttons, badges and highlights across all emails.
              </p>
            </div>

            {/* Logo image */}
            <div>
              <label className={labelClass}>Logo Image (optional)</label>
              <input
                ref={logoRef}
                type="file"
                accept="image/*"
                onChange={(e) =>
                  upload(e, setUploadingLogo, setLogoImage, logoRef)
                }
                className="hidden"
              />
              {logoImage ? (
                <div className="relative group w-full h-28 rounded-lg overflow-hidden bg-flow-950 border border-flow-700">
                  <img
                    src={logoImage}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {uploadingLogo ? (
                      <span className="text-xs text-white uppercase tracking-wide">
                        Uploading…
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => logoRef.current?.click()}
                          className="text-[11px] text-white uppercase tracking-wide bg-black/50 hover:bg-black/80 border border-white/30 rounded px-2.5 py-1"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogoImage("")}
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
                  className="w-full h-24 border-2 border-dashed border-flow-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-accent-500 transition-colors"
                  onClick={() => logoRef.current?.click()}
                >
                  {uploadingLogo ? (
                    <span className="text-xs text-flow-500">Uploading…</span>
                  ) : (
                    <span className="text-xs text-flow-500">
                      Upload logo (falls back to the FLOW wordmark)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Background image (hero band) */}
            <div>
              <label className={labelClass}>
                Background Photo (hero band, optional)
              </label>
              <input
                ref={bgRef}
                type="file"
                accept="image/*"
                onChange={(e) =>
                  upload(e, setUploadingBg, setBackgroundImage, bgRef)
                }
                className="hidden"
              />
              {backgroundImage ? (
                <div className="relative group w-full h-40 rounded-lg overflow-hidden bg-flow-950 border border-flow-700">
                  <img
                    src={backgroundImage}
                    alt="Background"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {uploadingBg ? (
                      <span className="text-xs text-white uppercase tracking-wide">
                        Uploading…
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => bgRef.current?.click()}
                          className="text-[11px] text-white uppercase tracking-wide bg-black/50 hover:bg-black/80 border border-white/30 rounded px-2.5 py-1"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => setBackgroundImage("")}
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
                  onClick={() => bgRef.current?.click()}
                >
                  {uploadingBg ? (
                    <span className="text-xs text-flow-500">Uploading…</span>
                  ) : (
                    <span className="text-xs text-flow-500">
                      Upload a background photo (shown behind the logo)
                    </span>
                  )}
                </div>
              )}
              <p className="text-[10px] text-flow-600 mt-1">
                Full-bleed photo behind the header logo (Gmail/Apple Mail).
                Outlook desktop shows a dark fallback.
              </p>
            </div>

            {/* Default hero image */}
            <div>
              <label className={labelClass}>
                Default Hero Image (optional)
              </label>
              <input
                ref={heroRef}
                type="file"
                accept="image/*"
                onChange={(e) =>
                  upload(e, setUploadingHero, setDefaultHeroImage, heroRef)
                }
                className="hidden"
              />
              {defaultHeroImage ? (
                <div className="relative group w-full h-40 rounded-lg overflow-hidden bg-flow-950 border border-flow-700">
                  <img
                    src={defaultHeroImage}
                    alt="Hero"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {uploadingHero ? (
                      <span className="text-xs text-white uppercase tracking-wide">
                        Uploading…
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => heroRef.current?.click()}
                          className="text-[11px] text-white uppercase tracking-wide bg-black/50 hover:bg-black/80 border border-white/30 rounded px-2.5 py-1"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => setDefaultHeroImage("")}
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
                  onClick={() => heroRef.current?.click()}
                >
                  {uploadingHero ? (
                    <span className="text-xs text-flow-500">Uploading…</span>
                  ) : (
                    <span className="text-xs text-flow-500">
                      Upload a default hero (transactional emails)
                    </span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className={labelClass}>Footer Tagline</label>
              <input
                className={inputClass}
                name="footerTagline"
                value={footerTagline}
                onChange={(e) => setFooterTagline(e.target.value)}
                placeholder={DEFAULT_FOOTER}
              />
            </div>

            <div>
              <label className={labelClass}>Unsubscribe URL</label>
              <input
                className={inputClass}
                name="unsubscribeUrl"
                value={unsubscribeUrl}
                onChange={(e) => setUnsubscribeUrl(e.target.value)}
                placeholder="https://www.flowurbanwear.com/unsubscribe"
                type="url"
              />
              <p className="text-[10px] text-flow-600 mt-1">
                Shown in the footer of marketing emails (campaigns, cart
                reminders).
              </p>
            </div>

          <div className="pt-2">
            <button
              type="submit"
              name="intent"
              value="save"
              disabled={isSubmitting}
              className="w-full bg-white text-flow-black font-display font-semibold text-sm tracking-wide uppercase rounded-lg px-6 py-3 hover:bg-flow-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Guardando..." : "Guardar diseño"}
            </button>
          </div>
        </div>

        {/* ── Right: live preview + test send ── */}
        <div className="lg:sticky lg:top-6 space-y-4">
          <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-4">
            {/* Template + device controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <select
                value={template}
                onChange={(e) =>
                  setTemplate(e.target.value as PreviewTemplateKey)
                }
                className="bg-flow-950 border border-flow-700 rounded-lg px-3 py-2 text-xs text-flow-100 focus:border-accent-500 focus:outline-none"
                aria-label="Tipo de correo"
              >
                {PREVIEW_TEMPLATES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1 bg-flow-950 border border-flow-700 rounded-lg p-1">
                {(["desktop", "mobile"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDevice(d)}
                    className={`text-[11px] uppercase tracking-wide rounded px-2.5 py-1 transition-colors ${
                      device === d
                        ? "bg-flow-700 text-white"
                        : "text-flow-400 hover:text-white"
                    }`}
                  >
                    {d === "desktop" ? "💻 Desktop" : "📱 Móvil"}
                  </button>
                ))}
              </div>
            </div>

            {/* Assembled preview */}
            <div className="relative bg-flow-950 rounded-lg border border-flow-800 overflow-auto flex justify-center">
              {previewLoading ? (
                <span className="absolute top-2 right-3 text-[10px] text-flow-500 uppercase tracking-wide">
                  Actualizando…
                </span>
              ) : null}
              {previewHtml ? (
                <iframe
                  title="Vista previa del correo"
                  srcDoc={previewHtml}
                  style={{
                    width: device === "mobile" ? 390 : 600,
                    height: 720,
                    border: "none",
                    background: "#0a0a0a",
                  }}
                />
              ) : (
                <div className="h-[720px] flex items-center justify-center text-xs text-flow-500">
                  Generando vista previa…
                </div>
              )}
            </div>
          </div>

          {/* Send a real test email to any address */}
          <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-4 space-y-3">
            <label className={labelClass}>Enviar prueba a</label>
            <input
              className={inputClass}
              name="testEmail"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
            />
            <button
              type="submit"
              name="intent"
              value="test"
              disabled={isSubmitting}
              className="w-full border border-flow-700 text-flow-200 font-display font-semibold text-sm tracking-wide uppercase rounded-lg px-6 py-3 hover:border-white hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Enviando..." : "Enviar correo de prueba"}
            </button>
            <p className="text-[10px] text-flow-600">
              Envía el correo seleccionado (con estos cambios, aunque no los
              hayas guardado) a la dirección indicada, para revisar cómo llega.
            </p>
          </div>
        </div>
      </Form>
    </motion.div>
  );
}

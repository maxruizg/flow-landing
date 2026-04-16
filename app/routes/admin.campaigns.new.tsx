import { json } from "@remix-run/node";
import type {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { useLoaderData, useFetcher, Link } from "@remix-run/react";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "~/lib/utils";
import { uploadImageClient } from "~/lib/supabase.client";
import { requireAdmin } from "~/lib/session.server";
import {
  getEmailTemplates,
  getCampaign,
  getCampaignContent,
  getSubscriberCount,
  createCampaign,
  updateCampaign,
  upsertCampaignContent,
} from "~/data/queries.server";

export const meta: MetaFunction = () => [
  { title: "FLOW Admin — Campaign Editor" },
];

// ─── Shared Styles ──────────────────────────────────────────

const inputClass =
  "w-full bg-flow-950 border border-flow-700 rounded-lg px-4 py-3 text-sm text-flow-100 placeholder:text-flow-500 focus:border-accent-500 focus:outline-none transition-colors";
const labelClass = "block text-xs text-flow-400 mb-1.5 uppercase tracking-wide";
const cardClass = "bg-flow-900 border border-flow-800/50 rounded-xl p-6";
const btnPrimary =
  "bg-white text-flow-black font-display font-semibold text-sm tracking-wide uppercase rounded-lg px-6 py-3 hover:bg-flow-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const btnSecondary =
  "border border-flow-700 text-flow-300 font-display font-semibold text-sm tracking-wide uppercase rounded-lg px-6 py-3 hover:border-flow-500 hover:text-white transition-colors";

// ─── Image Upload Widgets ───────────────────────────────────

function CampaignImageUpload({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImageClient(file, "campaigns");
      onChange(url);
    } catch (err: any) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      {value ? (
        <div className="relative group w-full h-40 rounded-lg overflow-hidden bg-flow-950 border border-flow-700">
          <img src={value} alt="" className="w-full h-full object-contain" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {uploading ? (
              <span className="text-xs text-white uppercase tracking-wide">Uploading…</span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="text-[11px] text-white uppercase tracking-wide bg-black/50 hover:bg-black/80 border border-white/30 rounded px-2.5 py-1"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={() => onChange("")}
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
          className="w-full h-40 border-2 border-dashed border-flow-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-accent-500 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <span className="text-xs text-flow-500">Uploading…</span>
          ) : (
            <>
              <svg className="w-6 h-6 text-flow-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs text-flow-500">Click to upload</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CampaignGalleryUpload({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(files.map((f) => uploadImageClient(f, "campaigns")));
      onChange([...value, ...uploaded]);
    } catch (err: any) {
      console.error("Gallery upload failed:", err);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="grid grid-cols-4 gap-3 mb-2">
        {value.map((url, i) => (
          <div key={`${url}-${i}`} className="relative group h-24 rounded-lg overflow-hidden bg-flow-950 border border-flow-700">
            <img src={url} alt="" className="w-full h-full object-contain" />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        <div
          className="h-24 border-2 border-dashed border-flow-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-accent-500 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <span className="text-[10px] text-flow-500">Uploading…</span>
          ) : (
            <>
              <svg className="w-5 h-5 text-flow-500 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-[10px] text-flow-500">Add</span>
            </>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
    </div>
  );
}

// ─── Types ──────────────────────────────────────────────────

interface VariableField {
  key: string;
  type: string;
  label: string;
  default?: any;
  fields?: VariableField[];
}

// ─── Loader ─────────────────────────────────────────────────

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);

  const url = new URL(request.url);
  const editId = url.searchParams.get("edit");

  const [templates, subscriberCount] = await Promise.all([
    getEmailTemplates(),
    getSubscriberCount(),
  ]);

  let campaign = null;
  let content = null;

  if (editId) {
    [campaign, content] = await Promise.all([
      getCampaign(editId),
      getCampaignContent(editId),
    ]);
  }

  return json({ templates, campaign, content, subscriberCount });
}

// ─── Action ─────────────────────────────────────────────────

export async function action({ request }: ActionFunctionArgs) {
  await requireAdmin(request);
  const form = await request.formData();
  const step = form.get("_step") as string;

  if (step === "1") {
    const name = (form.get("name") as string)?.trim();
    const templateId = form.get("template_id") as string;
    const existingId = form.get("campaign_id") as string | null;

    if (!name || !templateId) {
      return json({ error: "Name and template are required" }, { status: 400 });
    }

    if (existingId) {
      await updateCampaign(existingId, { name, templateId });
      return json({ campaignId: existingId });
    }

    const id = await createCampaign({ name, templateId });
    return json({ campaignId: id });
  }

  if (step === "2") {
    const campaignId = form.get("campaign_id") as string;
    const variablesJson = form.get("variables") as string;

    if (!campaignId) {
      return json({ error: "Campaign ID is required" }, { status: 400 });
    }

    const variables = variablesJson ? JSON.parse(variablesJson) : {};
    await upsertCampaignContent(campaignId, variables);
    return json({ campaignId });
  }

  if (step === "3") {
    const campaignId = form.get("campaign_id") as string;
    const subject = (form.get("subject") as string)?.trim();
    const preheader = (form.get("preheader") as string)?.trim() || "";
    const sendOption = form.get("send_option") as string;
    const scheduledAt = form.get("scheduled_at") as string | null;
    const targetType = form.get("target_type") as string;
    const targetTags = form.get("target_tags") as string;

    if (!campaignId || !subject) {
      return json({ error: "Campaign ID and subject are required" }, { status: 400 });
    }

    const status = sendOption === "now" ? "sending" : "scheduled";
    const tags =
      targetType === "tags" && targetTags
        ? targetTags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

    await updateCampaign(campaignId, {
      subject,
      preheader,
      status,
      scheduledAt: sendOption === "later" && scheduledAt ? scheduledAt : null,
      targetTags: tags,
    });

    return json({ campaignId, done: true });
  }

  return json({ error: "Invalid step" }, { status: 400 });
}

// ─── Step Indicator ─────────────────────────────────────────

function StepIndicator({
  currentStep,
  onStepClick,
}: {
  currentStep: number;
  onStepClick: (step: number) => void;
}) {
  const steps = [
    { num: 1, label: "Template" },
    { num: 2, label: "Content" },
    { num: 3, label: "Schedule" },
  ];

  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center">
          <button
            type="button"
            onClick={() => s.num < currentStep && onStepClick(s.num)}
            disabled={s.num > currentStep}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-display font-semibold uppercase tracking-wide transition-all",
              s.num === currentStep &&
                "bg-white text-flow-black",
              s.num < currentStep &&
                "bg-accent-500/20 text-accent-400 hover:bg-accent-500/30 cursor-pointer",
              s.num > currentStep &&
                "bg-flow-900 text-flow-600 cursor-not-allowed"
            )}
          >
            <span
              className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                s.num === currentStep && "bg-flow-black text-white",
                s.num < currentStep && "bg-accent-500 text-white",
                s.num > currentStep && "bg-flow-800 text-flow-600"
              )}
            >
              {s.num < currentStep ? "\u2713" : s.num}
            </span>
            {s.label}
          </button>
          {i < steps.length - 1 && (
            <div
              className={cn(
                "w-12 h-px mx-1",
                i + 1 < currentStep ? "bg-accent-500" : "bg-flow-800"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 1: Template Selection ─────────────────────────────

function StepTemplate({
  templates,
  selectedTemplateId,
  campaignName,
  onSelect,
  onNameChange,
  onContinue,
}: {
  templates: any[];
  selectedTemplateId: string | null;
  campaignName: string;
  onSelect: (id: string) => void;
  onNameChange: (name: string) => void;
  onContinue: () => void;
}) {
  const canContinue = campaignName.trim().length > 0 && selectedTemplateId;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className={cardClass}>
        <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide mb-4">
          Campaign Name
        </h2>
        <div>
          <label className={labelClass}>Name</label>
          <input
            className={inputClass}
            value={campaignName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Summer Sale Campaign"
          />
        </div>
      </div>

      <div className={cardClass}>
        <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide mb-4">
          Choose a Template
        </h2>
        {templates.length === 0 ? (
          <p className="text-sm text-flow-500 py-8 text-center">
            No templates available. Create one first.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelect(t.id)}
                className={cn(
                  "text-left rounded-xl border-2 p-5 transition-all",
                  selectedTemplateId === t.id
                    ? "border-accent-500 bg-accent-500/5"
                    : "border-flow-800/50 bg-flow-950 hover:border-flow-600"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-display font-semibold text-white">
                    {t.name}
                  </h3>
                  {selectedTemplateId === t.id && (
                    <span className="w-5 h-5 rounded-full bg-accent-500 flex items-center justify-center text-white text-[10px]">
                      &#10003;
                    </span>
                  )}
                </div>
                <p className="text-xs text-flow-500 leading-relaxed">
                  {t.description || t.component_name}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className={btnPrimary}
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
}

// ─── Step 2: Content Editor ─────────────────────────────────

function ArrayFieldEditor({
  field,
  items,
  onChange,
}: {
  field: VariableField;
  items: Record<string, any>[];
  onChange: (items: Record<string, any>[]) => void;
}) {
  const addItem = () => {
    const empty: Record<string, any> = {};
    for (const f of field.fields || []) {
      empty[f.key] = f.default ?? "";
    }
    onChange([...items, empty]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, key: string, value: string) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [key]: value } : item
    );
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className={labelClass}>{field.label}</label>
        <button
          type="button"
          onClick={addItem}
          className="text-xs text-accent-400 hover:text-accent-300 font-medium transition-colors"
        >
          + Add Item
        </button>
      </div>
      {items.map((item, i) => (
        <div
          key={i}
          className="bg-flow-950 border border-flow-800/50 rounded-lg p-4 space-y-3"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-flow-600 uppercase tracking-wide">
              Item {i + 1}
            </span>
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Remove
            </button>
          </div>
          {(field.fields || []).map((sub) => (
            <div key={sub.key}>
              <label className={labelClass}>{sub.label}</label>
              <input
                className={inputClass}
                value={item[sub.key] ?? ""}
                onChange={(e) => updateItem(i, sub.key, e.target.value)}
                placeholder={sub.label}
              />
            </div>
          ))}
        </div>
      ))}
      {items.length === 0 && (
        <p className="text-xs text-flow-600 text-center py-3">
          No items yet. Click &ldquo;+ Add Item&rdquo; to begin.
        </p>
      )}
    </div>
  );
}

function StepContent({
  schema,
  variables,
  componentName,
  onVariablesChange,
  onBack,
  onContinue,
}: {
  schema: VariableField[];
  variables: Record<string, any>;
  componentName: string;
  onVariablesChange: (vars: Record<string, any>) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchPreview = useCallback(
    (vars: Record<string, any>) => {
      setPreviewLoading(true);
      fetch("/api/email-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ componentName, variables: vars }),
      })
        .then((res) => {
          if (res.ok) return res.text();
          throw new Error("Preview failed");
        })
        .then((html) => setPreviewHtml(html))
        .catch(() => setPreviewHtml("<p style='color:#666;padding:2rem;'>Preview unavailable</p>"))
        .finally(() => setPreviewLoading(false));
    },
    [componentName]
  );

  // Debounced preview fetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPreview(variables), 800);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [variables, fetchPreview]);

  const updateVar = (key: string, value: any) => {
    onVariablesChange({ ...variables, [key]: value });
  };

  const renderField = (field: VariableField) => {
    if (field.type === "array") {
      return (
        <ArrayFieldEditor
          key={field.key}
          field={field}
          items={(variables[field.key] as Record<string, any>[]) || []}
          onChange={(items) => updateVar(field.key, items)}
        />
      );
    }

    if (field.type === "textarea") {
      return (
        <div key={field.key}>
          <label className={labelClass}>{field.label}</label>
          <textarea
            className={cn(inputClass, "resize-none")}
            rows={4}
            value={variables[field.key] ?? ""}
            onChange={(e) => updateVar(field.key, e.target.value)}
            placeholder={field.label}
          />
        </div>
      );
    }

    if (field.type === "color") {
      return (
        <div key={field.key}>
          <label className={labelClass}>{field.label}</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              className="w-10 h-10 rounded-lg border border-flow-700 bg-flow-950 cursor-pointer"
              value={variables[field.key] ?? "#000000"}
              onChange={(e) => updateVar(field.key, e.target.value)}
            />
            <input
              className={cn(inputClass, "flex-1")}
              value={variables[field.key] ?? ""}
              onChange={(e) => updateVar(field.key, e.target.value)}
              placeholder="#000000"
            />
          </div>
        </div>
      );
    }

    if (field.type === "image") {
      return (
        <CampaignImageUpload
          key={field.key}
          label={field.label}
          value={variables[field.key] ?? ""}
          onChange={(url) => updateVar(field.key, url)}
        />
      );
    }

    if (field.type === "image-array") {
      return (
        <CampaignGalleryUpload
          key={field.key}
          label={field.label}
          value={(variables[field.key] as string[]) ?? []}
          onChange={(urls) => updateVar(field.key, urls)}
        />
      );
    }

    return (
      <div key={field.key}>
        <label className={labelClass}>{field.label}</label>
        <input
          className={inputClass}
          value={variables[field.key] ?? ""}
          onChange={(e) => updateVar(field.key, e.target.value)}
          placeholder={field.label}
          type={field.type === "url" ? "url" : "text"}
        />
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Variables Form */}
        <div className="lg:col-span-2">
          <div className={cn(cardClass, "space-y-5")}>
            <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide">
              Email Content
            </h2>
            {schema.map(renderField)}
          </div>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-1">
          <div className={cn(cardClass, "sticky top-24")}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide">
                Preview
              </h2>
              <div className="flex items-center gap-1 bg-flow-950 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setPreviewMode("desktop")}
                  className={cn(
                    "px-3 py-1 text-[10px] uppercase tracking-wide font-semibold rounded-md transition-colors",
                    previewMode === "desktop"
                      ? "bg-flow-800 text-white"
                      : "text-flow-500 hover:text-flow-300"
                  )}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("mobile")}
                  className={cn(
                    "px-3 py-1 text-[10px] uppercase tracking-wide font-semibold rounded-md transition-colors",
                    previewMode === "mobile"
                      ? "bg-flow-800 text-white"
                      : "text-flow-500 hover:text-flow-300"
                  )}
                >
                  Mobile
                </button>
              </div>
            </div>
            <div className="relative bg-flow-950 rounded-lg overflow-hidden">
              {previewLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-flow-950/80">
                  <div className="w-5 h-5 border-2 border-flow-600 border-t-accent-500 rounded-full animate-spin" />
                </div>
              )}
              <iframe
                srcDoc={previewHtml}
                title="Email Preview"
                className={cn(
                  "border-0 bg-white transition-all duration-300 mx-auto block",
                  previewMode === "desktop" ? "w-full" : "w-[320px]"
                )}
                style={{ height: 500 }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className={btnSecondary}>
          Back
        </button>
        <button type="button" onClick={onContinue} className={btnPrimary}>
          Continue
        </button>
      </div>
    </motion.div>
  );
}

// ─── Step 3: Schedule ───────────────────────────────────────

function SubjectCounter({ length }: { length: number }) {
  const color =
    length >= 40 && length <= 60
      ? "text-green-400"
      : length > 0
        ? "text-yellow-400"
        : "text-flow-600";
  return <span className={cn("text-[10px] tabular-nums", color)}>{length}/60</span>;
}

function StepSchedule({
  campaignName,
  templateName,
  subscriberCount,
  subject,
  preheader,
  targetType,
  targetTags,
  sendOption,
  scheduledAt,
  onSubjectChange,
  onPreheaderChange,
  onTargetTypeChange,
  onTargetTagsChange,
  onSendOptionChange,
  onScheduledAtChange,
  onBack,
  onSaveDraft,
  onSubmit,
  isSubmitting,
}: {
  campaignName: string;
  templateName: string;
  subscriberCount: number;
  subject: string;
  preheader: string;
  targetType: "all" | "tags";
  targetTags: string;
  sendOption: "now" | "later";
  scheduledAt: string;
  onSubjectChange: (v: string) => void;
  onPreheaderChange: (v: string) => void;
  onTargetTypeChange: (v: "all" | "tags") => void;
  onTargetTagsChange: (v: string) => void;
  onSendOptionChange: (v: "now" | "later") => void;
  onScheduledAtChange: (v: string) => void;
  onBack: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Subject & Preheader */}
          <div className={cn(cardClass, "space-y-4")}>
            <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide">
              Subject Line
            </h2>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelClass}>Subject</label>
                <SubjectCounter length={subject.length} />
              </div>
              <input
                className={inputClass}
                value={subject}
                onChange={(e) => onSubjectChange(e.target.value)}
                placeholder="Your email subject line"
              />
            </div>
            <div>
              <label className={labelClass}>Preheader / Preview Text</label>
              <input
                className={inputClass}
                value={preheader}
                onChange={(e) => onPreheaderChange(e.target.value)}
                placeholder="Brief preview text shown in inbox"
              />
            </div>
          </div>

          {/* Audience */}
          <div className={cn(cardClass, "space-y-4")}>
            <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide">
              Target Audience
            </h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="target_type"
                  checked={targetType === "all"}
                  onChange={() => onTargetTypeChange("all")}
                  className="w-4 h-4 text-accent-500 bg-flow-950 border-flow-700"
                />
                <span className="text-sm text-flow-200">
                  All subscribers{" "}
                  <span className="text-flow-500">({subscriberCount})</span>
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="target_type"
                  checked={targetType === "tags"}
                  onChange={() => onTargetTypeChange("tags")}
                  className="w-4 h-4 text-accent-500 bg-flow-950 border-flow-700"
                />
                <span className="text-sm text-flow-200">By tags</span>
              </label>
              {targetType === "tags" && (
                <div className="pl-7">
                  <input
                    className={inputClass}
                    value={targetTags}
                    onChange={(e) => onTargetTagsChange(e.target.value)}
                    placeholder="vip, early-access (comma separated)"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Send Option */}
          <div className={cn(cardClass, "space-y-4")}>
            <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide">
              Send Option
            </h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="send_option"
                  checked={sendOption === "now"}
                  onChange={() => onSendOptionChange("now")}
                  className="w-4 h-4 text-accent-500 bg-flow-950 border-flow-700"
                />
                <span className="text-sm text-flow-200">Send now</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="send_option"
                  checked={sendOption === "later"}
                  onChange={() => onSendOptionChange("later")}
                  className="w-4 h-4 text-accent-500 bg-flow-950 border-flow-700"
                />
                <span className="text-sm text-flow-200">Schedule for later</span>
              </label>
              {sendOption === "later" && (
                <div className="pl-7">
                  <input
                    type="datetime-local"
                    className={inputClass}
                    value={scheduledAt}
                    onChange={(e) => onScheduledAtChange(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div>
          <div className={cn(cardClass, "sticky top-24 space-y-4")}>
            <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide">
              Summary
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-flow-600 uppercase tracking-wide">Campaign</p>
                <p className="text-sm text-flow-200 mt-0.5">{campaignName}</p>
              </div>
              <div>
                <p className="text-[10px] text-flow-600 uppercase tracking-wide">Template</p>
                <p className="text-sm text-flow-200 mt-0.5">{templateName}</p>
              </div>
              <div>
                <p className="text-[10px] text-flow-600 uppercase tracking-wide">Recipients</p>
                <p className="text-sm text-flow-200 mt-0.5">
                  {targetType === "all"
                    ? `All subscribers (${subscriberCount})`
                    : `Tags: ${targetTags || "none"}`}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-flow-600 uppercase tracking-wide">Subject</p>
                <p className="text-sm text-flow-200 mt-0.5">
                  {subject || <span className="text-flow-600 italic">Not set</span>}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-flow-600 uppercase tracking-wide">When</p>
                <p className="text-sm text-flow-200 mt-0.5">
                  {sendOption === "now"
                    ? "Immediately"
                    : scheduledAt
                      ? new Date(scheduledAt).toLocaleString()
                      : "Not scheduled"}
                </p>
              </div>
            </div>
            <div className="border-t border-flow-800/50 pt-4 space-y-2">
              <button
                type="button"
                disabled={!subject.trim() || isSubmitting}
                onClick={onSubmit}
                className={cn(btnPrimary, "w-full")}
              >
                {isSubmitting
                  ? "Saving..."
                  : sendOption === "now"
                    ? "Send Now"
                    : "Schedule Campaign"}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onSaveDraft}
                className={cn(btnSecondary, "w-full")}
              >
                Save as Draft
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-start">
        <button type="button" onClick={onBack} className={btnSecondary}>
          Back
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────

export default function CampaignEditor() {
  const { templates, campaign, content, subscriberCount } =
    useLoaderData<typeof loader>();
  const fetcher = useFetcher<{ campaignId?: string; done?: boolean; error?: string }>();

  // Wizard state
  const [step, setStep] = useState(() => {
    if (campaign) return 1; // start at 1 even when editing, user can advance
    return 1;
  });
  const [campaignId, setCampaignId] = useState<string | null>(
    campaign?.id ?? null
  );

  // Step 1 state
  const [campaignName, setCampaignName] = useState(campaign?.name ?? "");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    campaign?.template_id ?? null
  );

  // Step 2 state — build initial variables from saved content or template defaults
  const selectedTemplate = templates.find(
    (t: any) => t.id === selectedTemplateId
  );
  const schema: VariableField[] = selectedTemplate?.variables_schema
    ? typeof selectedTemplate.variables_schema === "string"
      ? JSON.parse(selectedTemplate.variables_schema)
      : selectedTemplate.variables_schema
    : [];

  const buildDefaults = useCallback((): Record<string, any> => {
    const defaults: Record<string, any> = {};
    for (const field of schema) {
      defaults[field.key] =
        field.default !== undefined ? field.default : field.type === "array" ? [] : "";
    }
    return defaults;
  }, [schema]);

  const [variables, setVariables] = useState<Record<string, any>>(() => {
    if (content?.variables && typeof content.variables === "object") {
      return content.variables as Record<string, any>;
    }
    return {};
  });

  // Re-initialize variables when template changes (only if no saved content)
  useEffect(() => {
    if (!content?.variables && schema.length > 0) {
      setVariables(buildDefaults());
    }
  }, [selectedTemplateId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Step 3 state
  const [subject, setSubject] = useState(campaign?.subject ?? "");
  const [preheader, setPreheader] = useState(campaign?.preheader ?? "");
  const [targetType, setTargetType] = useState<"all" | "tags">(
    campaign?.target_tags?.length ? "tags" : "all"
  );
  const [targetTags, setTargetTags] = useState(
    campaign?.target_tags?.join(", ") ?? ""
  );
  const [sendOption, setSendOption] = useState<"now" | "later">(
    campaign?.scheduled_at ? "later" : "now"
  );
  const [scheduledAt, setScheduledAt] = useState(
    campaign?.scheduled_at ?? ""
  );

  const isSubmitting = fetcher.state === "submitting";

  // Handle fetcher responses — advance step or track campaign ID
  useEffect(() => {
    if (fetcher.data?.campaignId && !fetcher.data?.done) {
      setCampaignId(fetcher.data.campaignId);
      // Advance to next step after successful save
      setStep((s) => Math.min(s + 1, 3));
    }
  }, [fetcher.data]);

  // ─── Step handlers ──────────────────────────────────

  const handleStep1Continue = () => {
    const formData = new FormData();
    formData.set("_step", "1");
    formData.set("name", campaignName);
    formData.set("template_id", selectedTemplateId!);
    if (campaignId) formData.set("campaign_id", campaignId);
    fetcher.submit(formData, { method: "post" });
  };

  const handleStep2Continue = () => {
    const formData = new FormData();
    formData.set("_step", "2");
    formData.set("campaign_id", campaignId!);
    formData.set("variables", JSON.stringify(variables));
    fetcher.submit(formData, { method: "post" });
  };

  const handleStep3Submit = () => {
    const formData = new FormData();
    formData.set("_step", "3");
    formData.set("campaign_id", campaignId!);
    formData.set("subject", subject);
    formData.set("preheader", preheader);
    formData.set("send_option", sendOption);
    formData.set("target_type", targetType);
    formData.set("target_tags", targetTags);
    if (sendOption === "later") formData.set("scheduled_at", scheduledAt);
    fetcher.submit(formData, { method: "post" });
  };

  const handleSaveDraft = () => {
    const formData = new FormData();
    formData.set("_step", "3");
    formData.set("campaign_id", campaignId!);
    formData.set("subject", subject);
    formData.set("preheader", preheader);
    formData.set("send_option", "draft");
    formData.set("target_type", targetType);
    formData.set("target_tags", targetTags);
    fetcher.submit(formData, { method: "post" });
  };

  // After final save, redirect (check for done flag)
  useEffect(() => {
    if (fetcher.data?.done && fetcher.data?.campaignId) {
      // Give a brief moment, then could navigate. For now we stay.
    }
  }, [fetcher.data]);

  const templateName =
    selectedTemplate?.name ?? campaign?.email_templates?.name ?? "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/newsletter"
            className="text-flow-500 hover:text-flow-300 transition-colors text-sm"
          >
            &larr; Back
          </Link>
          <h1 className="text-lg font-display font-bold text-white">
            {campaign ? "Edit Campaign" : "New Campaign"}
          </h1>
        </div>
        {campaignId && (
          <span className="text-[10px] text-flow-600 font-mono">{campaignId}</span>
        )}
      </div>

      {/* Error display */}
      {fetcher.data?.error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
          <p className="text-sm text-red-400">{fetcher.data.error}</p>
        </div>
      )}

      {/* Success display */}
      {fetcher.data?.done && (
        <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3">
          <p className="text-sm text-green-400">
            Campaign saved successfully.{" "}
            <Link to="/admin/newsletter" className="underline hover:text-green-300">
              Back to Newsletter
            </Link>
          </p>
        </div>
      )}

      <StepIndicator
        currentStep={step}
        onStepClick={(s) => setStep(s)}
      />

      {step === 1 && (
        <StepTemplate
          templates={templates}
          selectedTemplateId={selectedTemplateId}
          campaignName={campaignName}
          onSelect={setSelectedTemplateId}
          onNameChange={setCampaignName}
          onContinue={handleStep1Continue}
        />
      )}

      {step === 2 && (
        <StepContent
          schema={schema}
          variables={variables}
          componentName={selectedTemplate?.component_name ?? ""}
          onVariablesChange={setVariables}
          onBack={() => setStep(1)}
          onContinue={handleStep2Continue}
        />
      )}

      {step === 3 && (
        <StepSchedule
          campaignName={campaignName}
          templateName={templateName}
          subscriberCount={subscriberCount}
          subject={subject}
          preheader={preheader}
          targetType={targetType}
          targetTags={targetTags}
          sendOption={sendOption}
          scheduledAt={scheduledAt}
          onSubjectChange={setSubject}
          onPreheaderChange={setPreheader}
          onTargetTypeChange={setTargetType}
          onTargetTagsChange={setTargetTags}
          onSendOptionChange={setSendOption}
          onScheduledAtChange={setScheduledAt}
          onBack={() => setStep(2)}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleStep3Submit}
          isSubmitting={isSubmitting}
        />
      )}
    </motion.div>
  );
}

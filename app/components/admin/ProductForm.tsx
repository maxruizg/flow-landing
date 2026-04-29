import { Link, useNavigation } from "@remix-run/react";
import type { AdminProduct, ProductVariant } from "~/lib/types";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { uploadImageClient, uploadBlobClient } from "~/lib/supabase.client";
import { ImageAdjuster } from "~/components/admin/ImageAdjuster";
import { COLOR_HEX_MAP } from "~/lib/color-hex-map";

const inputClass =
  "w-full bg-flow-950 border border-flow-700 rounded-lg px-4 py-3 text-sm text-flow-100 placeholder:text-flow-500 focus:border-accent-500 focus:outline-none transition-colors";
const labelClass = "block text-xs text-flow-400 mb-1.5 uppercase tracking-wide";

function ImageUpload({
  label,
  existingUrl,
  onUploaded,
  aspect = 3 / 4,
  folder = "products",
}: {
  label: string;
  existingUrl?: string;
  onUploaded: (url: string) => void;
  aspect?: number;
  folder?: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(null);
    setError(null);
  }, [existingUrl]);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImageClient(file, folder);
      onUploaded(url);
    } catch (err: any) {
      setError(err?.message || "Upload failed");
      setPreview(null);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const displayUrl = preview || existingUrl;

  const handleAdjust = async (blob: Blob) => {
    setUploading(true);
    setError(null);
    try {
      const url = await uploadBlobClient(blob, folder);
      onUploaded(url);
      setAdjustOpen(false);
    } catch (err: any) {
      setError(err?.message || "Save failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
      {displayUrl ? (
        <div className="relative group w-full h-40 rounded-lg overflow-hidden bg-flow-950 border border-flow-700">
          <img src={displayUrl} alt="" className="w-full h-full object-contain" />
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
                  onClick={() => setAdjustOpen(true)}
                  className="text-[11px] text-flow-black uppercase tracking-wide bg-white hover:bg-flow-200 rounded px-2.5 py-1"
                >
                  Adjust
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
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      {displayUrl && (
        <ImageAdjuster
          open={adjustOpen}
          src={displayUrl}
          aspect={aspect}
          title={`Adjust — ${label}`}
          onCancel={() => setAdjustOpen(false)}
          onConfirm={handleAdjust}
        />
      )}
    </div>
  );
}

function GalleryUpload({
  existingUrls,
  onUrlsChange,
  aspect = 3 / 4,
}: {
  existingUrls: string[];
  onUrlsChange: (urls: string[]) => void;
  aspect?: number;
}) {
  const [urls, setUrls] = useState<string[]>(existingUrls);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adjustIndex, setAdjustIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUrls(existingUrls);
    setError(null);
  }, [existingUrls]);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded = await Promise.all(files.map((file) => uploadImageClient(file, "products")));
      const next = [...urls, ...uploaded];
      setUrls(next);
      onUrlsChange(next);
    } catch (err: any) {
      setError(err?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeUrl = (index: number) => {
    const next = urls.filter((_, i) => i !== index);
    setUrls(next);
    onUrlsChange(next);
  };

  const handleAdjustSave = async (blob: Blob) => {
    if (adjustIndex === null) return;
    setUploading(true);
    setError(null);
    try {
      const newUrl = await uploadBlobClient(blob, "products");
      const next = urls.map((u, i) => (i === adjustIndex ? newUrl : u));
      setUrls(next);
      onUrlsChange(next);
      setAdjustIndex(null);
    } catch (err: any) {
      setError(err?.message || "Save failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className={labelClass}>Gallery Images</label>
      <div className="grid grid-cols-4 gap-3 mb-2">
        {urls.map((url, i) => (
          <div key={`${url}-${i}`} className="relative group h-32 rounded-lg overflow-hidden bg-flow-950 border border-flow-700">
            <img src={url} alt="" className="w-full h-full object-contain" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={() => setAdjustIndex(i)}
                className="text-[10px] text-flow-black uppercase tracking-wide bg-white hover:bg-flow-200 rounded px-2 py-1"
              >
                Adjust
              </button>
            </div>
            <button
              type="button"
              onClick={() => removeUrl(i)}
              className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        <div
          className="h-32 border-2 border-dashed border-flow-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-accent-500 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <span className="text-xs text-flow-500">Uploading…</span>
          ) : (
            <>
              <svg className="w-6 h-6 text-flow-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs text-flow-500">Add Images</span>
            </>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      {adjustIndex !== null && urls[adjustIndex] && (
        <ImageAdjuster
          open
          src={urls[adjustIndex]}
          aspect={aspect}
          title="Adjust Gallery Image"
          onCancel={() => setAdjustIndex(null)}
          onConfirm={handleAdjustSave}
        />
      )}
    </div>
  );
}

interface VariantDraft {
  id: string;
  colorName: string;
  colorHex: string | null;
  sku: string;
  price: string;
  priceMxn: string;
  compareAtPrice: string;
  image: string;
  imageHover: string;
  gallery: string[];
  sizeStock: Record<string, number>;
  status: "active" | "draft" | "archived";
  badge: string | null;
  isNew: boolean;
  sortOrder: number;
  description: string;
}

interface ProductFormProps {
  product: AdminProduct | null;
  siblings?: AdminProduct[] | null; // unused in variants era — kept for loader compat
}

function kebab(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function hexForColor(name: string): string {
  return COLOR_HEX_MAP[name.toLowerCase().trim()] ?? "#888888";
}

function variantFromProductVariant(v: ProductVariant): VariantDraft {
  return {
    id: v.id,
    colorName: v.colorName,
    colorHex: v.colorHex ?? null,
    sku: v.sku,
    price: String(v.price),
    priceMxn: v.priceMxn != null ? String(v.priceMxn) : "",
    compareAtPrice: v.compareAtPrice != null ? String(v.compareAtPrice) : "",
    image: v.image,
    imageHover: v.imageHover,
    gallery: v.images ?? [],
    sizeStock: v.sizeStock ?? {},
    status: v.status,
    badge: v.badge,
    isNew: v.isNew,
    sortOrder: v.sortOrder,
    description: v.description ?? "",
  };
}

function emptyVariant(index: number): VariantDraft {
  return {
    id: `new-${Date.now()}-${index}`,
    colorName: "",
    colorHex: null,
    sku: "",
    price: "",
    priceMxn: "",
    compareAtPrice: "",
    image: "",
    imageHover: "",
    gallery: [],
    sizeStock: {},
    status: "active",
    badge: null,
    isNew: false,
    sortOrder: index + 1,
    description: "",
  };
}

export function ProductForm({ product }: ProductFormProps) {
  const isEdit = !!product;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [form, setForm] = useState({
    name: "",
    category: "Tops",
    gender: "unisex" as "men" | "women" | "unisex",
    sizes: "S, M, L, XL",
    material: "",
    origin: "",
    fit: "",
    brand: "",
    tags: "",
    displayPosition: "last" as "first" | "last",
  });

  const [variants, setVariants] = useState<VariantDraft[]>([emptyVariant(0)]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [defaultIndex, setDefaultIndex] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [colorError, setColorError] = useState<string | null>(null);
  const loadedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!product) return;
    if (loadedRef.current === product.id) return;
    loadedRef.current = product.id;

    setForm({
      name: product.name,
      category: product.category,
      gender: product.gender,
      sizes: product.sizes.join(", "),
      material: product.material,
      origin: product.origin,
      fit: product.fit || "",
      brand: product.brand ?? "",
      tags: (product.tags ?? []).join(", "),
      displayPosition: "last",
    });

    const sorted = [...product.variants].sort((a, b) => a.sortOrder - b.sortOrder);
    const drafts = sorted.map(variantFromProductVariant);
    setVariants(drafts.length > 0 ? drafts : [emptyVariant(0)]);
    setActiveIndex(0);
    setDeletedIds([]);
    const idx = drafts.findIndex((d) => d.id === product.defaultVariantId);
    setDefaultIndex(idx >= 0 ? idx : 0);
  }, [product]);

  const parsedSizes = useMemo(
    () => form.sizes.split(",").map((s) => s.trim()).filter(Boolean),
    [form.sizes],
  );

  // No sizeStock sync effect — adding a size to the list should NOT mutate
  // existing variant stock values. The input below handles missing keys
  // gracefully (renders as empty), and onChange writes the value when the
  // admin types one in. Removing the previous sync prevents a race that
  // could wipe loaded values during the initial mount.

  const updateForm = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const updateVariant = useCallback(
    (index: number, patch: Partial<VariantDraft>) =>
      setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v))),
    [],
  );

  const updateVariantColor = (index: number, colorName: string) => {
    const hex = COLOR_HEX_MAP[colorName.toLowerCase().trim()] ?? variants[index].colorHex;
    updateVariant(index, { colorName, colorHex: hex ?? null });
    const otherColors = variants
      .filter((_, i) => i !== index)
      .map((v) => v.colorName.toLowerCase().trim());
    if (colorName.trim() && otherColors.includes(colorName.toLowerCase().trim())) {
      setColorError("Duplicate color name");
    } else {
      setColorError(null);
    }
  };

  const addVariant = () => {
    const next = emptyVariant(variants.length);
    setVariants((prev) => [...prev, next]);
    setActiveIndex(variants.length);
  };

  const requestRemove = (index: number) => {
    const total = Object.values(variants[index].sizeStock).reduce((a, b) => a + b, 0);
    if (total > 0) {
      setPendingDelete(index);
    } else {
      doRemove(index);
    }
  };

  const doRemove = (index: number) => {
    const variant = variants[index];
    if (!variant.id.startsWith("new-")) setDeletedIds((prev) => [...prev, variant.id]);
    const next = variants.filter((_, i) => i !== index);
    setVariants(next.length > 0 ? next : [emptyVariant(0)]);
    setActiveIndex(Math.min(index, next.length - 1));
    if (defaultIndex >= next.length) setDefaultIndex(0);
    else if (defaultIndex === index) setDefaultIndex(0);
    else if (defaultIndex > index) setDefaultIndex(defaultIndex - 1);
    setPendingDelete(null);
    setColorError(null);
  };

  const activeVariant = variants[activeIndex];
  const activeStockTotal = Object.values(activeVariant?.sizeStock ?? {}).reduce((a, b) => a + b, 0);

  const hasEmptyColor = variants.some((v) => !v.colorName.trim());
  const hasEmptyPrice = variants.some((v) => !v.price.trim() || Number(v.price) <= 0);
  const formInvalid = !!colorError || hasEmptyColor || hasEmptyPrice;

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin/products" className="text-flow-400 hover:text-white transition-colors p-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-display font-semibold text-white">
          {isEdit ? "Edit Product" : "New Product"}
        </h1>
      </div>

      <form method="post">
        <input type="hidden" name="variants_count" value={variants.length} />
        <input type="hidden" name="default_variant_index" value={defaultIndex} />
        <input type="hidden" name="deleted_variant_ids" value={JSON.stringify(deletedIds)} />

        {variants.map((v, i) => (
          <div key={v.id}>
            <input type="hidden" name={`variant_${i}_id`} value={v.id} />
            <input type="hidden" name={`variant_${i}_color`} value={v.colorName} />
            <input type="hidden" name={`variant_${i}_color_hex`} value={v.colorHex ?? ""} />
            <input type="hidden" name={`variant_${i}_sku`} value={v.sku} />
            <input type="hidden" name={`variant_${i}_price`} value={v.price} />
            <input type="hidden" name={`variant_${i}_price_mxn`} value={v.priceMxn} />
            <input type="hidden" name={`variant_${i}_compare_at_price`} value={v.compareAtPrice} />
            <input type="hidden" name={`variant_${i}_image`} value={v.image} />
            <input type="hidden" name={`variant_${i}_imageHover`} value={v.imageHover} />
            <input type="hidden" name={`variant_${i}_gallery`} value={JSON.stringify(v.gallery)} />
            <input type="hidden" name={`variant_${i}_size_stock`} value={JSON.stringify(v.sizeStock)} />
            <input type="hidden" name={`variant_${i}_status`} value={v.status} />
            <input type="hidden" name={`variant_${i}_badge`} value={v.badge ?? ""} />
            <input type="hidden" name={`variant_${i}_isNew`} value={v.isNew ? "true" : "false"} />
            <input type="hidden" name={`variant_${i}_description`} value={v.description} />
          </div>
        ))}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Color Variants */}
            <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide">
                  Color Variants
                </h2>
                <span className="text-[11px] text-flow-500">
                  {variants.length} {variants.length === 1 ? "color" : "colors"}
                </span>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {variants.map((v, i) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setActiveIndex(i)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      i === activeIndex
                        ? "bg-white text-flow-black"
                        : "bg-flow-800 text-flow-300 hover:bg-flow-700"
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-white/20"
                      style={{ backgroundColor: v.colorHex ?? hexForColor(v.colorName) }}
                    />
                    {v.colorName || "Untitled"}
                    {defaultIndex === i && (
                      <span className="text-[9px] uppercase tracking-wider opacity-70 ml-1">
                        default
                      </span>
                    )}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={addVariant}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-flow-800 text-flow-400 hover:bg-flow-700 hover:text-flow-200 transition-colors border border-dashed border-flow-600"
                >
                  + Add Color
                </button>
              </div>

              {variants.map((v, i) => (
                <div key={v.id} className={i === activeIndex ? "" : "hidden"}>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className={labelClass}>Color Name</label>
                      <input
                        className={inputClass}
                        value={v.colorName}
                        onChange={(e) => updateVariantColor(i, e.target.value)}
                        placeholder="Black"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Color Hex</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={v.colorHex ?? hexForColor(v.colorName)}
                          onChange={(e) => updateVariant(i, { colorHex: e.target.value })}
                          className="h-11 w-14 rounded-lg bg-flow-950 border border-flow-700 cursor-pointer"
                        />
                        <input
                          className={inputClass}
                          value={v.colorHex ?? ""}
                          onChange={(e) => updateVariant(i, { colorHex: e.target.value || null })}
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  </div>

                  {colorError && i === activeIndex && (
                    <p className="text-red-400 text-xs mb-3">{colorError}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className={labelClass}>SKU</label>
                      <input
                        className={inputClass}
                        value={v.sku}
                        onChange={(e) => updateVariant(i, { sku: e.target.value })}
                        placeholder={`${kebab(form.name)}-${kebab(v.colorName) || "color"}`}
                      />
                    </div>
                    <div className="flex items-end gap-3 pb-0.5">
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-flow-300">
                        <input
                          type="radio"
                          name="_default_variant_radio"
                          checked={defaultIndex === i}
                          onChange={() => setDefaultIndex(i)}
                          className="w-4 h-4 text-accent-500 bg-flow-950 border-flow-700 focus:ring-accent-500"
                        />
                        Set as default
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className={labelClass}>Price (USD)</label>
                      <input
                        className={inputClass}
                        type="number"
                        min="0"
                        step="0.01"
                        value={v.price}
                        onChange={(e) => updateVariant(i, { price: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Price (MXN)</label>
                      <input
                        className={inputClass}
                        type="number"
                        min="0"
                        value={v.priceMxn}
                        onChange={(e) => updateVariant(i, { priceMxn: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Compare At</label>
                      <input
                        className={inputClass}
                        type="number"
                        min="0"
                        step="0.01"
                        value={v.compareAtPrice}
                        onChange={(e) => updateVariant(i, { compareAtPrice: e.target.value })}
                        placeholder="—"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className={labelClass}>Description</label>
                    <textarea
                      className={`${inputClass} resize-none`}
                      rows={4}
                      value={v.description}
                      onChange={(e) => updateVariant(i, { description: e.target.value })}
                      placeholder={`Description for ${v.colorName || "this color"}...`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <ImageUpload
                      label="Main Image"
                      existingUrl={v.image || undefined}
                      onUploaded={(url) => updateVariant(i, { image: url })}
                    />
                    <ImageUpload
                      label="Hover Image"
                      existingUrl={v.imageHover || undefined}
                      onUploaded={(url) => updateVariant(i, { imageHover: url })}
                    />
                  </div>
                  <GalleryUpload
                    existingUrls={v.gallery}
                    onUrlsChange={(urls) => updateVariant(i, { gallery: urls })}
                  />

                  {variants.length > 1 && (
                    <div className="mt-4 pt-4 border-t border-flow-800/50">
                      <button
                        type="button"
                        onClick={() => requestRemove(i)}
                        className="text-xs text-red-400 border border-red-500/30 rounded-lg px-3 py-2 hover:bg-red-500/10 transition-colors uppercase tracking-wide"
                      >
                        Remove This Color
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Basic Info */}
            <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-6">
              <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide mb-4">
                Basic Info
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Name</label>
                  <input
                    className={inputClass}
                    name="name"
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    placeholder="Product name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Brand</label>
                    <input
                      className={inputClass}
                      name="brand"
                      value={form.brand}
                      onChange={(e) => updateForm("brand", e.target.value)}
                      placeholder="Brand (optional)"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Tags (comma-separated)</label>
                    <input
                      className={inputClass}
                      name="tags_raw"
                      value={form.tags}
                      onChange={(e) => updateForm("tags", e.target.value)}
                      placeholder="summer, graphic"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-6">
              <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide mb-4">
                Product Details
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Material</label>
                  <input
                    className={inputClass}
                    name="material"
                    value={form.material}
                    onChange={(e) => updateForm("material", e.target.value)}
                    placeholder="100% Cotton"
                  />
                </div>
                <div>
                  <label className={labelClass}>Origin</label>
                  <input
                    className={inputClass}
                    name="origin"
                    value={form.origin}
                    onChange={(e) => updateForm("origin", e.target.value)}
                    placeholder="Made in Mexico"
                  />
                </div>
                <div>
                  <label className={labelClass}>Fit</label>
                  <input
                    className={inputClass}
                    name="fit"
                    value={form.fit}
                    onChange={(e) => updateForm("fit", e.target.value)}
                    placeholder="Regular"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-6">
              <div className="mb-4">
                <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide">
                  Status & Meta
                </h2>
                <p className="text-[11px] text-flow-500 mt-0.5">
                  Per color{activeVariant?.colorName ? (
                    <> — <span className="text-flow-300">{activeVariant.colorName}</span></>
                  ) : null}
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Status</label>
                  <select
                    className={inputClass}
                    value={activeVariant?.status ?? "active"}
                    onChange={(e) =>
                      updateVariant(activeIndex, {
                        status: e.target.value as VariantDraft["status"],
                      })
                    }
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Badge</label>
                  <select
                    className={inputClass}
                    value={activeVariant?.badge ?? ""}
                    onChange={(e) => updateVariant(activeIndex, { badge: e.target.value || null })}
                  >
                    <option value="">None</option>
                    <option value="New">New</option>
                    <option value="Best Seller">Best Seller</option>
                    <option value="Low Stock">Low Stock</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>New Drop</label>
                  <label className="flex items-center gap-2 h-[46px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeVariant?.isNew ?? false}
                      onChange={(e) => updateVariant(activeIndex, { isNew: e.target.checked })}
                      className="w-4 h-4 rounded border-flow-700 bg-flow-950 text-accent-500 focus:ring-accent-500"
                    />
                    <span className="text-sm text-flow-300">Is New</span>
                  </label>
                </div>
                <div>
                  <label className={labelClass}>
                    Stock per Size
                    {activeVariant?.colorName && (
                      <span className="text-flow-600 normal-case tracking-normal ml-1">
                        — {activeVariant.colorName}
                      </span>
                    )}
                  </label>
                  {parsedSizes.length > 0 ? (
                    <div className="space-y-2">
                      {parsedSizes.map((size) => (
                        <div key={size} className="flex items-center gap-3">
                          <span className="text-xs text-flow-400 uppercase tracking-wide w-10 shrink-0">
                            {size}
                          </span>
                          <input
                            className={inputClass}
                            type="number"
                            min="0"
                            value={(() => {
                              const stock = activeVariant?.sizeStock?.[size];
                              if (stock === undefined || stock === null) return "";
                              return String(stock);
                            })()}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const qty = raw === "" ? 0 : Math.max(0, parseInt(raw, 10) || 0);
                              updateVariant(activeIndex, {
                                sizeStock: { ...(activeVariant?.sizeStock ?? {}), [size]: qty },
                              });
                            }}
                            onFocus={(e) => e.currentTarget.select()}
                            placeholder="0"
                          />
                        </div>
                      ))}
                      <p className="text-xs text-flow-500 pt-1">
                        Total ({activeVariant?.colorName || "this color"}): {activeStockTotal}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-flow-500 py-3">Enter sizes first</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-6">
              <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide mb-4">
                Organization
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Category</label>
                  <select
                    className={inputClass}
                    name="category"
                    value={form.category}
                    onChange={(e) => updateForm("category", e.target.value)}
                  >
                    <option value="Tops">Tops</option>
                    <option value="Bottoms">Bottoms</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Gender</label>
                  <select
                    className={inputClass}
                    name="gender"
                    value={form.gender}
                    onChange={(e) =>
                      updateForm("gender", e.target.value)
                    }
                  >
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                    <option value="unisex">Unisex</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Sizes (comma-separated)</label>
                  <input
                    className={inputClass}
                    name="sizes_raw"
                    value={form.sizes}
                    onChange={(e) => updateForm("sizes", e.target.value)}
                    placeholder="S, M, L, XL"
                  />
                </div>
                {!isEdit && (
                  <div>
                    <label className={labelClass}>Display Position</label>
                    <select
                      className={inputClass}
                      name="display_position"
                      value={form.displayPosition}
                      onChange={(e) => updateForm("displayPosition", e.target.value)}
                    >
                      <option value="first">First (top of page)</option>
                      <option value="last">Last (bottom of page)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Sticky action bar — always visible while editing */}
        <div className="sticky bottom-0 -mx-4 lg:-mx-6 mt-8 px-4 lg:px-6 py-3 bg-flow-950/90 backdrop-blur-md border-t border-flow-800 flex items-center gap-3 justify-end z-20">
          {formInvalid && (
            <span className="text-xs text-amber-400 mr-auto">
              {colorError
                ? colorError
                : hasEmptyColor
                  ? "Each color variant needs a name."
                  : hasEmptyPrice
                    ? "Each variant needs a price."
                    : "Please fix validation errors."}
            </span>
          )}
          <Link
            to="/admin/products"
            className="px-5 py-2.5 border border-flow-700 text-flow-300 rounded-lg text-sm hover:bg-flow-800 transition-colors text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={formInvalid || isSubmitting}
            className="bg-white text-flow-black font-display font-semibold text-sm tracking-wide uppercase rounded-lg px-6 py-2.5 hover:bg-flow-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving…" : isEdit ? "Save Changes" : "Add Product"}
          </button>
        </div>
      </form>

      {/* Confirm-delete-with-stock modal */}
      {pendingDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setPendingDelete(null)} />
          <div className="relative bg-flow-900 border border-flow-800/50 rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-white font-display font-semibold mb-2">
              Remove "{variants[pendingDelete]?.colorName}"?
            </h3>
            <p className="text-sm text-flow-400 mb-6">
              This color still has stock. Removing it here stages a deletion that
              runs when you save. The variant row will be deleted from the database.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingDelete(null)}
                className="flex-1 px-4 py-2.5 border border-flow-700 text-flow-300 rounded-lg text-sm hover:bg-flow-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => pendingDelete !== null && doRemove(pendingDelete)}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

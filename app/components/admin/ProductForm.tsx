import { Link } from "@remix-run/react";
import type { AdminProduct } from "~/lib/types";
import { useState, useEffect, useRef } from "react";

const inputClass =
  "w-full bg-flow-950 border border-flow-700 rounded-lg px-4 py-3 text-sm text-flow-100 placeholder:text-flow-500 focus:border-accent-500 focus:outline-none transition-colors";
const labelClass = "block text-xs text-flow-400 mb-1.5 uppercase tracking-wide";

function ImageUpload({
  label,
  name,
  existingUrl,
}: {
  label: string;
  name: string;
  existingUrl?: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(null);
  }, [existingUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const displayUrl = preview || existingUrl;

  return (
    <div>
      <label className={labelClass}>{label}</label>
      {existingUrl && !preview && (
        <input type="hidden" name={`${name}_existing`} value={existingUrl} />
      )}
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      {displayUrl ? (
        <div
          className="relative group w-full h-40 rounded-lg overflow-hidden bg-flow-950 border border-flow-700 cursor-pointer"
          onClick={() => inputRef.current?.click()}
        >
          <img src={displayUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-xs text-white uppercase tracking-wide">Change</span>
          </div>
        </div>
      ) : (
        <div
          className="w-full h-40 border-2 border-dashed border-flow-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-accent-500 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <svg className="w-6 h-6 text-flow-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs text-flow-500">Click to upload</span>
        </div>
      )}
    </div>
  );
}

function GalleryUpload({
  namePrefix,
  existingUrls,
}: {
  namePrefix: string;
  existingUrls: string[];
}) {
  const [newPreviews, setNewPreviews] = useState<{ file: File; preview: string }[]>([]);
  const [kept, setKept] = useState<string[]>(existingUrls);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setKept(existingUrls);
    setNewPreviews([]);
  }, [existingUrls]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const previews = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setNewPreviews((prev) => [...prev, ...previews]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeKept = (url: string) => {
    setKept((prev) => prev.filter((u) => u !== url));
  };

  const removeNew = (index: number) => {
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className={labelClass}>Gallery Images</label>
      {kept.map((url) => (
        <input key={url} type="hidden" name={`${namePrefix}_gallery_existing`} value={url} />
      ))}
      <div className="grid grid-cols-4 gap-3 mb-2">
        {kept.map((url) => (
          <div key={url} className="relative group h-32 rounded-lg overflow-hidden bg-flow-950 border border-flow-700">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeKept(url)}
              className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        {newPreviews.map((item, i) => (
          <div key={i} className="relative group h-32 rounded-lg overflow-hidden bg-flow-950 border border-flow-700">
            <img src={item.preview} alt="" className="w-full h-full object-cover" />
            <input type="file" name={`${namePrefix}_gallery_new`} className="hidden" />
            <button
              type="button"
              onClick={() => removeNew(i)}
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
          <svg className="w-6 h-6 text-flow-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-xs text-flow-500">Add Images</span>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        name={`${namePrefix}_gallery_new`}
        accept="image/*"
        multiple
        onChange={handleFiles}
        className="hidden"
      />
    </div>
  );
}

interface Variant {
  id: string;
  color: string;
  imageExisting?: string;
  imageHoverExisting?: string;
  galleryExisting: string[];
  position: number;
}

interface ProductFormProps {
  product: AdminProduct | null;
  siblings?: AdminProduct[] | null;
}

export function ProductForm({ product, siblings }: ProductFormProps) {
  const isEdit = !!product;

  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "Tops",
    gender: "unisex" as string,
    sizes: "S, M, L, XL",
    material: "",
    stock: "",
    description: "",
    origin: "",
    fit: "",
    badge: "",
    isNew: false,
    status: "active" as string,
  });

  const [variants, setVariants] = useState<Variant[]>([
    { id: `new-${Date.now()}`, color: "", galleryExisting: [], position: -1 },
  ]);
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([]);
  const [colorError, setColorError] = useState<string | null>(null);

  useEffect(() => {
    const sources = siblings && siblings.length > 0 ? siblings : product ? [product] : null;
    if (sources && sources.length > 0) {
      const first = sources[0];
      setForm({
        name: first.name,
        price: String(first.price),
        category: first.category,
        gender: first.gender,
        sizes: first.sizes.join(", "),
        material: first.material,
        stock: String(first.stock),
        description: first.description,
        origin: first.origin,
        fit: first.fit || "",
        badge: first.badge || "",
        isNew: first.isNew || false,
        status: first.status,
      });
      setVariants(
        sources.map((s) => ({
          id: s.id,
          color: s.color,
          imageExisting: s.image,
          imageHoverExisting: s.imageHover,
          galleryExisting: s.images || [],
          position: s.position,
        }))
      );
      setActiveVariantIndex(0);
      setDeletedVariantIds([]);
    }
  }, [product, siblings]);

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const updateVariantColor = (index: number, color: string) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, color } : v)));
    // Check for duplicate colors
    const otherColors = variants
      .filter((_, i) => i !== index)
      .map((v) => v.color.toLowerCase().trim());
    if (color.trim() && otherColors.includes(color.toLowerCase().trim())) {
      setColorError("Duplicate color name");
    } else {
      setColorError(null);
    }
  };

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, color: "", galleryExisting: [], position: -1 },
    ]);
    setActiveVariantIndex(variants.length);
  };

  const removeVariant = (index: number) => {
    const variant = variants[index];
    if (!variant.id.startsWith("new-")) {
      setDeletedVariantIds((prev) => [...prev, variant.id]);
    }
    const next = variants.filter((_, i) => i !== index);
    setVariants(next);
    setActiveVariantIndex(Math.min(activeVariantIndex, next.length - 1));
    setColorError(null);
  };

  const hasEmptyColor = variants.some((v) => !v.color.trim());
  const formInvalid = !!colorError || hasEmptyColor;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/admin/products"
          className="text-flow-400 hover:text-white transition-colors p-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-display font-semibold text-white">
          {isEdit ? "Edit Product" : "New Product"}
        </h1>
      </div>

      <form method="post" encType="multipart/form-data">
        <input type="hidden" name="variants_count" value={variants.length} />
        <input type="hidden" name="deleted_variant_ids" value={JSON.stringify(deletedVariantIds)} />

        {/* Serialize variant hidden fields */}
        {variants.map((variant, i) => (
          <div key={variant.id}>
            <input type="hidden" name={`variant_${i}_id`} value={variant.id} />
            <input type="hidden" name={`variant_${i}_position`} value={variant.position} />
          </div>
        ))}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Color Variants */}
            <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide">Color Variants</h2>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {variants.map((variant, i) => (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setActiveVariantIndex(i)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      i === activeVariantIndex
                        ? "bg-white text-flow-black"
                        : "bg-flow-800 text-flow-300 hover:bg-flow-700"
                    }`}
                  >
                    {variant.color || "Untitled"}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={addVariant}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-flow-800 text-flow-400 hover:bg-flow-700 hover:text-flow-200 transition-colors border border-dashed border-flow-600"
                >
                  + Add Color
                </button>
              </div>

              {/* Variant panels — hidden via CSS to preserve file input state */}
              {variants.map((variant, i) => (
                <div
                  key={variant.id}
                  className={i === activeVariantIndex ? "" : "hidden"}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                      <label className={labelClass}>Color</label>
                      <input
                        className={inputClass}
                        name={`variant_${i}_color`}
                        value={variant.color}
                        onChange={(e) => updateVariantColor(i, e.target.value)}
                        placeholder="Black"
                      />
                    </div>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(i)}
                        className="mt-5 px-3 py-2.5 text-xs text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors uppercase tracking-wide"
                      >
                        Remove Color
                      </button>
                    )}
                  </div>

                  {colorError && i === activeVariantIndex && (
                    <p className="text-red-400 text-xs mb-3">{colorError}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <ImageUpload
                      label="Main Image"
                      name={`variant_${i}_image`}
                      existingUrl={variant.imageExisting}
                    />
                    <ImageUpload
                      label="Hover Image"
                      name={`variant_${i}_imageHover`}
                      existingUrl={variant.imageHoverExisting}
                    />
                  </div>
                  <GalleryUpload
                    namePrefix={`variant_${i}`}
                    existingUrls={variant.galleryExisting}
                  />
                </div>
              ))}
            </div>

            {/* Basic Info */}
            <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-6">
              <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide mb-4">Basic Info</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Name</label>
                  <input className={inputClass} name="name" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Product name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Price (USD)</label>
                    <input className={inputClass} type="number" name="price" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="0" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Description</label>
                  <textarea
                    className={`${inputClass} resize-none`}
                    rows={4}
                    name="description"
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    placeholder="Product description..."
                  />
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-6">
              <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide mb-4">Product Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Material</label>
                  <input className={inputClass} name="material" value={form.material} onChange={(e) => update("material", e.target.value)} placeholder="100% Cotton" />
                </div>
                <div>
                  <label className={labelClass}>Origin</label>
                  <input className={inputClass} name="origin" value={form.origin} onChange={(e) => update("origin", e.target.value)} placeholder="Made in Mexico" />
                </div>
                <div>
                  <label className={labelClass}>Fit</label>
                  <input className={inputClass} name="fit" value={form.fit} onChange={(e) => update("fit", e.target.value)} placeholder="Regular" />
                </div>
              </div>
            </div>
          </div>

          {/* Right column (1/3) */}
          <div className="space-y-6">
            {/* Status & Meta */}
            <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-6">
              <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide mb-4">Status & Meta</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Status</label>
                  <select className={inputClass} name="status" value={form.status} onChange={(e) => update("status", e.target.value)}>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Badge</label>
                  <select className={inputClass} name="badge" value={form.badge} onChange={(e) => update("badge", e.target.value)}>
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
                      name="isNew"
                      value="true"
                      checked={form.isNew}
                      onChange={(e) => update("isNew", e.target.checked)}
                      className="w-4 h-4 rounded border-flow-700 bg-flow-950 text-accent-500 focus:ring-accent-500"
                    />
                    <span className="text-sm text-flow-300">Is New</span>
                  </label>
                </div>
                <div>
                  <label className={labelClass}>Stock</label>
                  <input className={inputClass} type="number" name="stock" value={form.stock} onChange={(e) => update("stock", e.target.value)} placeholder="0" />
                </div>
              </div>
            </div>

            {/* Organization */}
            <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-6">
              <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide mb-4">Organization</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Category</label>
                  <select className={inputClass} name="category" value={form.category} onChange={(e) => update("category", e.target.value)}>
                    <option value="Tops">Tops</option>
                    <option value="Bottoms">Bottoms</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Gender</label>
                  <select className={inputClass} name="gender" value={form.gender} onChange={(e) => update("gender", e.target.value)}>
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                    <option value="unisex">Unisex</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Sizes (comma-separated)</label>
                  <input className={inputClass} name="sizes_raw" value={form.sizes} onChange={(e) => update("sizes", e.target.value)} placeholder="S, M, L, XL" />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={formInvalid}
                className="flex-1 bg-white text-flow-black font-display font-semibold text-sm tracking-wide uppercase rounded-lg px-6 py-3 hover:bg-flow-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEdit ? "Save Changes" : "Add Product"}
              </button>
              <Link
                to="/admin/products"
                className="px-6 py-3 border border-flow-700 text-flow-300 rounded-lg text-sm hover:bg-flow-800 transition-colors text-center"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

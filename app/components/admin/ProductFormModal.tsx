import { SlidePanel } from "~/components/layout/SlidePanel";
import type { AdminProduct } from "~/data/admin-mock";
import { useState, useEffect } from "react";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: AdminProduct | null;
}

const inputClass =
  "w-full bg-flow-950 border border-flow-700 rounded-lg px-4 py-3 text-sm text-flow-100 placeholder:text-flow-500 focus:border-accent-500 focus:outline-none transition-colors";
const labelClass = "block text-xs text-flow-400 mb-1.5 uppercase tracking-wide";

export function ProductFormModal({ isOpen, onClose, product }: ProductFormModalProps) {
  const isEdit = !!product;
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "Tops",
    gender: "unisex" as string,
    sizes: "S, M, L, XL",
    material: "",
    color: "",
    stock: "",
    description: "",
  });

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        price: String(product.price),
        category: product.category,
        gender: product.gender,
        sizes: product.sizes.join(", "),
        material: product.material,
        color: product.color,
        stock: String(product.stock),
        description: product.description,
      });
    } else {
      setForm({
        name: "",
        price: "",
        category: "Tops",
        gender: "unisex",
        sizes: "S, M, L, XL",
        material: "",
        color: "",
        stock: "",
        description: "",
      });
    }
  }, [product]);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <SlidePanel isOpen={isOpen} onClose={onClose} title={isEdit ? "Edit Product" : "Add Product"}>
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Name</label>
          <input className={inputClass} value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Product name" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Price (USD)</label>
            <input className={inputClass} type="number" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className={labelClass}>Stock</label>
            <input className={inputClass} type="number" value={form.stock} onChange={(e) => update("stock", e.target.value)} placeholder="0" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Category</label>
            <select className={inputClass} value={form.category} onChange={(e) => update("category", e.target.value)}>
              <option value="Tops">Tops</option>
              <option value="Bottoms">Bottoms</option>
              <option value="Accessories">Accessories</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Gender</label>
            <select className={inputClass} value={form.gender} onChange={(e) => update("gender", e.target.value)}>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="unisex">Unisex</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Sizes (comma-separated)</label>
          <input className={inputClass} value={form.sizes} onChange={(e) => update("sizes", e.target.value)} placeholder="S, M, L, XL" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Material</label>
            <input className={inputClass} value={form.material} onChange={(e) => update("material", e.target.value)} placeholder="100% Cotton" />
          </div>
          <div>
            <label className={labelClass}>Color</label>
            <input className={inputClass} value={form.color} onChange={(e) => update("color", e.target.value)} placeholder="Black" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            className={`${inputClass} resize-none`}
            rows={3}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Product description..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 bg-white text-flow-black font-display font-semibold text-sm tracking-wide uppercase rounded-lg px-6 py-3 hover:bg-flow-200 transition-colors"
          >
            {isEdit ? "Save Changes" : "Add Product"}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 border border-flow-700 text-flow-300 rounded-lg text-sm hover:bg-flow-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </SlidePanel>
  );
}

import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form, Link } from "@remix-run/react";
import type { MetaFunction, ActionFunctionArgs } from "@remix-run/node";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { cn, formatPrice } from "~/lib/utils";
import {
  getAdminProducts,
  deleteProduct,
  updateProductPositions,
} from "~/data/queries.server";
import { AdminEmptyState } from "~/components/admin/AdminEmptyState";
import type { AdminProduct } from "~/lib/types";

export const meta: MetaFunction = () => [{ title: "FLOW Admin — Products" }];

export async function loader() {
  const adminProducts = await getAdminProducts();
  return json({ adminProducts });
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "delete") {
    const id = form.get("id") as string;
    await deleteProduct(id);
  } else if (intent === "reorder") {
    const payload = JSON.parse(form.get("positions") as string);
    await updateProductPositions(payload);
  }

  return redirect("/admin/products");
}

export default function AdminProducts() {
  const { adminProducts } = useLoaderData<typeof loader>();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [gender, setGender] = useState("All");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [arrangeMode, setArrangeMode] = useState(false);
  const [orderedProducts, setOrderedProducts] = useState<AdminProduct[]>([]);

  const categories = ["All", ...new Set(adminProducts.map((p) => p.category))];
  const genders = ["All", "men", "women", "unisex"];

  const filtered = useMemo(() => {
    return adminProducts.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === "All" || p.category === category;
      const matchGender = gender === "All" || p.gender === gender;
      return matchSearch && matchCat && matchGender;
    });
  }, [adminProducts, search, category, gender]);

  const toggleArrange = () => {
    if (!arrangeMode) {
      setOrderedProducts([...adminProducts]);
    }
    setArrangeMode(!arrangeMode);
  };

  const moveProduct = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= orderedProducts.length) return;
    const updated = [...orderedProducts];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    setOrderedProducts(updated);
  };

  const inputClass =
    "bg-flow-950 border border-flow-700 rounded-lg px-4 py-2.5 text-sm text-flow-100 placeholder:text-flow-500 focus:border-accent-500 focus:outline-none transition-colors";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(inputClass, "sm:max-w-xs")}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass}>
            {genders.map((g) => (
              <option key={g} value={g}>{g === "All" ? "All Genders" : g.charAt(0).toUpperCase() + g.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleArrange}
            className={cn(
              "font-display font-semibold text-xs tracking-wide uppercase rounded-lg px-5 py-2.5 transition-colors whitespace-nowrap border",
              arrangeMode
                ? "border-accent-500 text-accent-400 hover:bg-accent-500/10"
                : "border-flow-700 text-flow-300 hover:bg-flow-800"
            )}
          >
            {arrangeMode ? "Cancel" : "Arrange"}
          </button>
          <Link
            to="new"
            className="bg-white text-flow-black font-display font-semibold text-xs tracking-wide uppercase rounded-lg px-5 py-2.5 hover:bg-flow-200 transition-colors whitespace-nowrap"
          >
            + Add Product
          </Link>
        </div>
      </div>

      {/* Arrange mode */}
      {arrangeMode ? (
        <div className="bg-flow-900 border border-flow-800/50 rounded-xl overflow-hidden">
          <div className="divide-y divide-flow-800/30">
            {orderedProducts.map((product, index) => (
              <div key={product.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveProduct(index, -1)}
                    disabled={index === 0}
                    className="text-flow-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors p-0.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveProduct(index, 1)}
                    disabled={index === orderedProducts.length - 1}
                    className="text-flow-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors p-0.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                <span className="text-xs text-flow-500 w-6 text-center">{index + 1}</span>
                <div className="w-10 h-10 rounded-lg bg-flow-800 overflow-hidden flex-shrink-0">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{product.name}</p>
                  <p className="text-xs text-flow-500">{product.color}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-4 border-t border-flow-800/30">
            <Form method="post">
              <input type="hidden" name="intent" value="reorder" />
              <input
                type="hidden"
                name="positions"
                value={JSON.stringify(
                  orderedProducts.map((p, i) => ({ id: p.id, position: i + 1 }))
                )}
              />
              <button
                type="submit"
                className="bg-white text-flow-black font-display font-semibold text-xs tracking-wide uppercase rounded-lg px-5 py-2.5 hover:bg-flow-200 transition-colors"
              >
                Save Order
              </button>
            </Form>
          </div>
        </div>
      ) : (
        <>
          {/* Table */}
          {filtered.length === 0 ? (
            <AdminEmptyState
              icon={
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              }
              message="No products match your filters."
            />
          ) : (
            <div className="bg-flow-900 border border-flow-800/50 rounded-xl overflow-hidden">
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-flow-800/30">
                      <th className="text-left text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">Product</th>
                      <th className="text-left text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">Price</th>
                      <th className="text-left text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">Category</th>
                      <th className="text-left text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">Stock</th>
                      <th className="text-left text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">Status</th>
                      <th className="text-right text-flow-500 text-xs uppercase tracking-wide font-medium px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((product) => (
                      <tr key={product.id} className="border-b border-flow-800/30 last:border-0 hover:bg-flow-800/50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-flow-800 overflow-hidden flex-shrink-0">
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="text-sm text-white font-medium">{product.name}</p>
                              <p className="text-xs text-flow-500 capitalize">{product.gender}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm text-white">{formatPrice(product.price)}</td>
                        <td className="px-5 py-3 text-sm text-flow-400">{product.category}</td>
                        <td className="px-5 py-3 text-sm">
                          <span className={product.stock === 0 ? "text-red-400" : product.stock < 10 ? "text-yellow-400" : "text-flow-300"}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                              product.status === "active" && "bg-green-500/10 text-green-400",
                              product.status === "draft" && "bg-flow-700/30 text-flow-400",
                              product.status === "out_of_stock" && "bg-red-500/10 text-red-400"
                            )}
                          >
                            {product.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={product.id}
                              className="text-flow-400 hover:text-white transition-colors p-1"
                              aria-label={`Edit ${product.name}`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Link>
                            <button
                              onClick={() => setDeleteId(product.id)}
                              className="text-flow-400 hover:text-red-400 transition-colors p-1"
                              aria-label={`Delete ${product.name}`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-flow-800/30">
                {filtered.map((product) => (
                  <div key={product.id} className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-flow-800 overflow-hidden flex-shrink-0">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{product.name}</p>
                        <p className="text-xs text-flow-500">{product.category} &middot; {formatPrice(product.price)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Link to={product.id} className="text-flow-400 hover:text-white p-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button onClick={() => setDeleteId(product.id)} className="text-flow-400 hover:text-red-400 p-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className={product.stock === 0 ? "text-red-400" : product.stock < 10 ? "text-yellow-400" : "text-flow-400"}>
                        Stock: {product.stock}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full font-medium capitalize",
                          product.status === "active" && "bg-green-500/10 text-green-400",
                          product.status === "draft" && "bg-flow-700/30 text-flow-400",
                          product.status === "out_of_stock" && "bg-red-500/10 text-red-400"
                        )}
                      >
                        {product.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDeleteId(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-flow-900 border border-flow-800/50 rounded-xl p-6 max-w-sm w-full"
          >
            <h3 className="text-white font-display font-semibold mb-2">Delete Product</h3>
            <p className="text-sm text-flow-400 mb-6">Are you sure you want to delete this product? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2.5 border border-flow-700 text-flow-300 rounded-lg text-sm hover:bg-flow-800 transition-colors"
              >
                Cancel
              </button>
              <form method="post">
                <input type="hidden" name="intent" value="delete" />
                <input type="hidden" name="id" value={deleteId} />
                <button
                  type="submit"
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
}

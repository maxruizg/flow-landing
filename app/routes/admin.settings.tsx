import { json } from "@remix-run/node";
import type { MetaFunction, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { motion } from "framer-motion";
import { useState } from "react";
import { brand, shippingPolicy, refundPolicy, privacyTerms } from "~/data/brand";
import { requireAdmin } from "~/lib/session.server";
import { getAllAdmins, createAdmin, deleteAdmin, updateAdminUser, getAdminCount } from "~/data/queries.server";
import { hashPassword } from "~/lib/auth.server";
import { cn } from "~/lib/utils";

export const meta: MetaFunction = () => [{ title: "FLOW Admin — Settings" }];

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  const admins = await getAllAdmins();
  return json({ admins });
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAdmin(request);
  const form = await request.formData();
  const intent = form.get("intent") as string;

  if (intent === "add-admin") {
    const name = (form.get("name") as string || "").trim();
    const email = (form.get("email") as string || "").trim();
    const password = form.get("password") as string || "";

    if (!name || !email || !password) {
      return json({ error: "All fields are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    try {
      const hash = hashPassword(password);
      await createAdmin(name, email, hash);
      return json({ success: true });
    } catch (err: any) {
      if (err?.code === "23505") {
        return json({ error: "An admin with this email already exists" }, { status: 400 });
      }
      return json({ error: "Failed to create admin" }, { status: 500 });
    }
  }

  if (intent === "update-admin") {
    const id = form.get("id") as string;
    const name = (form.get("name") as string || "").trim();
    const email = (form.get("email") as string || "").trim();
    const password = (form.get("password") as string || "").trim();

    if (!name || !email) {
      return json({ error: "Name and email are required" }, { status: 400 });
    }
    if (password && password.length < 6) {
      return json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    try {
      const updates: { name: string; email: string; passwordHash?: string } = { name, email };
      if (password) updates.passwordHash = hashPassword(password);
      await updateAdminUser(id, updates);
      return json({ success: true });
    } catch (err: any) {
      if (err?.code === "23505") {
        return json({ error: "An admin with this email already exists" }, { status: 400 });
      }
      return json({ error: "Failed to update admin" }, { status: 500 });
    }
  }

  if (intent === "delete-admin") {
    const id = form.get("id") as string;
    const count = await getAdminCount();
    if (count <= 1) {
      return json({ error: "Cannot remove the last admin" }, { status: 400 });
    }
    await deleteAdmin(id);
    return json({ success: true });
  }

  return json({ error: "Unknown action" }, { status: 400 });
}

const inputClass =
  "w-full bg-flow-950 border border-flow-700 rounded-lg px-4 py-3 text-sm text-flow-100 placeholder:text-flow-500 focus:border-accent-500 focus:outline-none transition-colors";
const labelClass = "block text-xs text-flow-400 mb-1.5 uppercase tracking-wide";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-5 space-y-4">
      <h3 className="text-xs uppercase tracking-wide text-flow-500 font-medium border-b border-flow-800/30 pb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function AdminManagement() {
  const { admins } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<{ success?: boolean; error?: string }>();
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editShowPassword, setEditShowPassword] = useState(false);

  const isSubmitting = fetcher.state !== "idle";
  const error = fetcher.data?.error;
  const justAdded = fetcher.data?.success && fetcher.formData?.get("intent") === "add-admin";

  return (
    <Section title="Admin Users">
      <div className="space-y-3">
        {admins.map((admin) => (
          <div key={admin.id}>
            {editingId === admin.id ? (
              <fetcher.Form
                method="post"
                className="bg-flow-950 rounded-lg border border-flow-800/30 p-4 space-y-3"
                onSubmit={() => {
                  setEditingId(null);
                  setEditShowPassword(false);
                }}
              >
                <input type="hidden" name="intent" value="update-admin" />
                <input type="hidden" name="id" value={admin.id} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Name</label>
                    <input className={inputClass} name="name" required defaultValue={admin.name} />
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input className={inputClass} name="email" type="email" required defaultValue={admin.email} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>New Password (leave blank to keep current)</label>
                  <div className="relative">
                    <input
                      className={inputClass}
                      name="password"
                      type={editShowPassword ? "text" : "password"}
                      minLength={6}
                      placeholder="Leave blank to keep current"
                    />
                    <button
                      type="button"
                      onClick={() => setEditShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-flow-500 hover:text-white transition-colors"
                    >
                      {editShowPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                      "px-5 py-2 bg-white text-flow-black font-display font-semibold text-xs tracking-wide uppercase rounded-lg hover:bg-flow-200 transition-colors",
                      isSubmitting && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isSubmitting ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditingId(null); setEditShowPassword(false); }}
                    className="px-5 py-2 text-flow-400 text-xs uppercase tracking-wide hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </fetcher.Form>
            ) : (
              <div className="flex items-center justify-between py-2 px-3 bg-flow-950 rounded-lg border border-flow-800/30">
                <div>
                  <p className="text-sm text-white font-medium">{admin.name}</p>
                  <p className="text-xs text-flow-500">{admin.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setEditingId(admin.id); setEditShowPassword(false); }}
                    className="text-xs text-flow-400 hover:text-white transition-colors px-3 py-1.5 rounded border border-flow-700 hover:bg-flow-800"
                  >
                    Edit
                  </button>
                  {admins.length > 1 && (
                    <fetcher.Form method="post">
                      <input type="hidden" name="intent" value="delete-admin" />
                      <input type="hidden" name="id" value={admin.id} />
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 rounded border border-red-500/20 hover:bg-red-500/10"
                      >
                        Remove
                      </button>
                    </fetcher.Form>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {justAdded && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-xs text-green-400">Admin added successfully</p>
        </div>
      )}

      {showForm ? (
        <fetcher.Form method="post" className="space-y-3 pt-2 border-t border-flow-800/30">
          <input type="hidden" name="intent" value="add-admin" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Name</label>
              <input
                className={inputClass}
                name="name"
                required
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                className={inputClass}
                name="email"
                type="email"
                required
                placeholder="jane@flowurbanwear.com"
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Password</label>
            <div className="relative">
              <input
                className={inputClass}
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder="Min 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-flow-500 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "px-5 py-2.5 bg-white text-flow-black font-display font-semibold text-xs tracking-wide uppercase rounded-lg hover:bg-flow-200 transition-colors",
                isSubmitting && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSubmitting ? "Adding..." : "Add Admin"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 text-flow-400 text-xs uppercase tracking-wide hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </fetcher.Form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="text-xs text-flow-400 hover:text-white transition-colors flex items-center gap-1.5 pt-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Admin
        </button>
      )}
    </Section>
  );
}

export default function AdminSettings() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-3xl"
    >
      {/* Admin Users — at the top for visibility */}
      <AdminManagement />

      <Section title="Store Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Store Name</label>
            <input className={inputClass} defaultValue={brand.name} readOnly />
          </div>
          <div>
            <label className={labelClass}>Founder</label>
            <input className={inputClass} defaultValue={brand.founder} readOnly />
          </div>
        </div>
        <div>
          <label className={labelClass}>Origin</label>
          <input className={inputClass} defaultValue={brand.origin} readOnly />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea className={`${inputClass} resize-none`} rows={3} defaultValue={brand.description} readOnly />
        </div>
      </Section>

      <Section title="Shipping Policy">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Carrier</label>
            <input className={inputClass} defaultValue={shippingPolicy.carrier} readOnly />
          </div>
          <div>
            <label className={labelClass}>Origin</label>
            <input className={inputClass} defaultValue={shippingPolicy.origin} readOnly />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>CDMX Delivery</label>
            <input className={inputClass} defaultValue={shippingPolicy.cdmx} readOnly />
          </div>
          <div>
            <label className={labelClass}>National Delivery</label>
            <input className={inputClass} defaultValue={shippingPolicy.national} readOnly />
          </div>
          <div>
            <label className={labelClass}>International</label>
            <input className={inputClass} defaultValue={shippingPolicy.international} readOnly />
          </div>
        </div>
      </Section>

      <Section title="Refund Policy">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Refund Window</label>
            <input className={inputClass} defaultValue={refundPolicy.refundWindow} readOnly />
          </div>
          <div>
            <label className={labelClass}>Exchange Window</label>
            <input className={inputClass} defaultValue={refundPolicy.exchangeWindow} readOnly />
          </div>
        </div>
        <div>
          <label className={labelClass}>Non-Returnable Conditions</label>
          <textarea
            className={`${inputClass} resize-none`}
            rows={4}
            defaultValue={refundPolicy.nonReturnable.join("\n")}
            readOnly
          />
        </div>
      </Section>

      <Section title="Legal">
        <div>
          <label className={labelClass}>Privacy Policy</label>
          <textarea className={`${inputClass} resize-none`} rows={4} defaultValue={privacyTerms.privacy} readOnly />
        </div>
        <div>
          <label className={labelClass}>Terms of Service</label>
          <textarea className={`${inputClass} resize-none`} rows={4} defaultValue={privacyTerms.terms} readOnly />
        </div>
      </Section>
    </motion.div>
  );
}

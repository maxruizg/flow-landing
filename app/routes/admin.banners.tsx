import { json } from "@remix-run/node";
import { useLoaderData, Form, useNavigation, useActionData } from "@remix-run/react";
import type { MetaFunction, ActionFunctionArgs } from "@remix-run/node";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { getBanner, upsertBanner } from "~/data/queries.server";

export const meta: MetaFunction = () => [{ title: "FLOW Admin — Banners" }];

const inputClass =
  "w-full bg-flow-950 border border-flow-700 rounded-lg px-4 py-3 text-sm text-flow-100 placeholder:text-flow-500 focus:border-accent-500 focus:outline-none transition-colors";
const labelClass = "block text-xs text-flow-400 mb-1.5 uppercase tracking-wide";

// --- Timezone helpers ---
// datetime-local inputs use "YYYY-MM-DDTHH:mm" in LOCAL time.
// Postgres timestamptz stores UTC. We need to convert between the two.

function utcToLocalInput(utcIso: string | null): string {
  if (!utcIso) return "";
  const d = new Date(utcIso);
  if (isNaN(d.getTime())) return "";
  // Build YYYY-MM-DDTHH:mm in local tz
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToUtc(local: string): string | null {
  if (!local) return null;
  const d = new Date(local); // Parses as local time
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

export async function loader() {
  const banner = await getBanner();
  return json({ banner });
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const id = (form.get("id") as string) || `banner-${Date.now()}`;
  const title = (form.get("title") as string)?.trim() || "";
  const description = (form.get("description") as string)?.trim() || "";
  const active = form.get("active") === "true";
  const startLocal = (form.get("start_date") as string) || "";
  const endLocal = (form.get("end_date") as string) || "";

  if (!title) {
    return json({ success: false, error: "Title is required" }, { status: 400 });
  }

  // Convert datetime-local (local time) → UTC ISO for storage
  const startDate = localInputToUtc(startLocal);
  const endDate = localInputToUtc(endLocal);

  if (startDate && endDate && new Date(startDate).getTime() > new Date(endDate).getTime()) {
    return json({ success: false, error: "End date must be after start date" }, { status: 400 });
  }

  await upsertBanner({ id, title, description, active, startDate, endDate });

  return json({ success: true, savedAt: Date.now() });
}

type BannerStatus =
  | { state: "live"; label: string }
  | { state: "inactive"; label: string }
  | { state: "expired"; label: string }
  | { state: "scheduled"; label: string };

function computeBannerStatus(active: boolean, startLocal: string, endLocal: string): BannerStatus {
  if (!active) return { state: "inactive", label: "Inactive — toggle 'Active' to enable" };
  const now = new Date();
  if (startLocal) {
    const start = new Date(startLocal);
    if (start.getTime() > now.getTime()) {
      return {
        state: "scheduled",
        label: `Scheduled to start ${start.toLocaleString()}`,
      };
    }
  }
  if (endLocal) {
    const end = new Date(endLocal);
    if (end.getTime() < now.getTime()) {
      return {
        state: "expired",
        label: `Expired on ${end.toLocaleString()}`,
      };
    }
  }
  return { state: "live", label: "Live on the homepage right now" };
}

export default function AdminBanners() {
  const { banner } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [title, setTitle] = useState(banner?.title || "");
  const [description, setDescription] = useState(banner?.description || "");
  const [active, setActive] = useState(banner?.active || false);
  const [startDate, setStartDate] = useState(utcToLocalInput(banner?.startDate || null));
  const [endDate, setEndDate] = useState(utcToLocalInput(banner?.endDate || null));

  // Show success toast briefly after save
  const [showToast, setShowToast] = useState(false);
  useEffect(() => {
    if (actionData?.success) {
      setShowToast(true);
      const t = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(t);
    }
  }, [actionData]);

  const status = computeBannerStatus(active, startDate, endDate);
  const statusColor: Record<BannerStatus["state"], string> = {
    live: "text-green-400",
    inactive: "text-flow-500",
    expired: "text-red-400",
    scheduled: "text-yellow-400",
  };
  const statusDot: Record<BannerStatus["state"], string> = {
    live: "bg-green-400 animate-pulse",
    inactive: "bg-flow-600",
    expired: "bg-red-500",
    scheduled: "bg-yellow-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-4xl relative"
    >
      {/* Success toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.33, 1, 0.68, 1] }}
            className="fixed top-20 right-6 z-50 bg-green-500/95 backdrop-blur-sm text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">Banner saved successfully</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error banner */}
      {actionData && actionData.success === false && "error" in actionData && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
          <p className="text-sm text-red-400">{actionData.error}</p>
        </div>
      )}

      {/* Live status */}
      <div className="flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-full ${statusDot[status.state]}`} />
        <span className={`text-sm font-medium ${statusColor[status.state]}`}>
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-3">
          <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-6">
            <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide mb-4">
              Hero Banner
            </h2>

            <Form method="post" className="space-y-4">
              {banner?.id && <input type="hidden" name="id" value={banner.id} />}

              <div>
                <label className={labelClass}>Title</label>
                <input
                  className={inputClass}
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="FREE SHIPPING ON ALL ORDERS"
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Description (optional)</label>
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={2}
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Use code FLOW10 for 10% off your first order"
                />
              </div>

              <div>
                <label className={labelClass}>Active</label>
                <label className="flex items-center gap-2 h-[46px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="w-4 h-4 rounded border-flow-700 bg-flow-950 text-accent-500 focus:ring-accent-500"
                  />
                  <span className="text-sm text-flow-300">Show banner on homepage</span>
                </label>
                <input type="hidden" name="active" value={active ? "true" : "false"} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Start Date</label>
                  <input
                    type="datetime-local"
                    className={inputClass}
                    name="start_date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <p className="text-[10px] text-flow-600 mt-1">Leave empty = starts immediately</p>
                </div>
                <div>
                  <label className={labelClass}>End Date</label>
                  <input
                    type="datetime-local"
                    className={inputClass}
                    name="end_date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  <p className="text-[10px] text-flow-600 mt-1">Leave empty = runs indefinitely</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="bg-white text-flow-black font-display font-semibold text-sm tracking-wide uppercase rounded-lg px-6 py-3 hover:bg-flow-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Saving..." : "Save Banner"}
              </button>
            </Form>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-6 sticky top-6">
            <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide mb-4">
              Hero Preview
            </h2>

            {title.trim() ? (
              <div className="rounded-lg overflow-hidden border border-flow-800/30 relative">
                {/* Simulated hero background */}
                <div className="relative h-48 bg-gradient-to-br from-flow-800 via-flow-900 to-flow-950 overflow-hidden">
                  {/* Banner overlay — matches Hero.tsx exactly */}
                  <div className="absolute top-0 left-0 right-0 z-10 overflow-hidden">
                    <div className="relative bg-flow-black/70 backdrop-blur-md border-b border-white/10">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
                      <div className="relative px-4 py-3 text-center">
                        <p className="text-[11px] font-display font-semibold uppercase tracking-[0.25em] text-white">
                          {title}
                        </p>
                        {description && (
                          <p className="text-[10px] text-flow-400 mt-1 tracking-wide">
                            {description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Fake hero content */}
                  <div className="absolute inset-0 flex flex-col justify-end px-5 pb-5">
                    <div className="text-[9px] uppercase tracking-[0.3em] text-flow-400 mb-1">
                      SS26 Collection
                    </div>
                    <div className="font-display text-2xl font-bold text-white leading-[0.9]">
                      LESS THINKING<br />MORE FLOW
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-flow-700 h-48 flex items-center justify-center">
                <span className="text-xs text-flow-600">Enter a title to see preview</span>
              </div>
            )}

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-flow-500">Status</span>
                <span className={statusColor[status.state] + " font-medium capitalize"}>
                  {status.state}
                </span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-flow-500 shrink-0">Schedule</span>
                <span className="text-flow-300 text-right">
                  {!startDate && !endDate
                    ? "Always visible"
                    : `${startDate ? new Date(startDate).toLocaleString() : "Now"} — ${endDate ? new Date(endDate).toLocaleString() : "forever"}`}
                </span>
              </div>
              <div className="pt-2 border-t border-flow-800/30">
                <p className={`text-[11px] ${statusColor[status.state]}`}>
                  {status.label}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

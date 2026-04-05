import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form, useNavigation } from "@remix-run/react";
import type { MetaFunction, ActionFunctionArgs } from "@remix-run/node";
import { motion } from "framer-motion";
import { useState } from "react";
import { getBanner, upsertBanner } from "~/data/queries.server";

export const meta: MetaFunction = () => [{ title: "FLOW Admin — Banners" }];

const inputClass =
  "w-full bg-flow-950 border border-flow-700 rounded-lg px-4 py-3 text-sm text-flow-100 placeholder:text-flow-500 focus:border-accent-500 focus:outline-none transition-colors";
const labelClass = "block text-xs text-flow-400 mb-1.5 uppercase tracking-wide";

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
  const startDate = (form.get("start_date") as string) || null;
  const endDate = (form.get("end_date") as string) || null;

  await upsertBanner({
    id,
    title,
    description,
    active,
    startDate: startDate || null,
    endDate: endDate || null,
  });

  return redirect("/admin/banners");
}

function isCurrentlyLive(active: boolean, startDate: string, endDate: string): boolean {
  if (!active) return false;
  const now = new Date();
  if (startDate && new Date(startDate) > now) return false;
  if (endDate && new Date(endDate) < now) return false;
  return true;
}

export default function AdminBanners() {
  const { banner } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [title, setTitle] = useState(banner?.title || "");
  const [description, setDescription] = useState(banner?.description || "");
  const [active, setActive] = useState(banner?.active || false);
  const [startDate, setStartDate] = useState(banner?.startDate ? banner.startDate.slice(0, 16) : "");
  const [endDate, setEndDate] = useState(banner?.endDate ? banner.endDate.slice(0, 16) : "");

  const live = isCurrentlyLive(active, startDate, endDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-3xl"
    >
      {/* Status */}
      <div className="flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-full ${live ? "bg-green-400 animate-pulse" : "bg-flow-600"}`} />
        <span className={`text-sm font-medium ${live ? "text-green-400" : "text-flow-500"}`}>
          {live ? "Banner is live on the homepage" : "Banner is not visible"}
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
          <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-6">
            <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide mb-4">
              Preview
            </h2>

            {title.trim() ? (
              <div className="rounded-lg overflow-hidden border border-flow-800/30">
                <div className="relative bg-flow-black/70 backdrop-blur-md border-b border-white/10">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
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
                <div className="bg-flow-950 h-32 flex items-center justify-center">
                  <span className="text-xs text-flow-600">Hero section below</span>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-flow-700 h-32 flex items-center justify-center">
                <span className="text-xs text-flow-600">Enter a title to see preview</span>
              </div>
            )}

            <div className="mt-4 space-y-2 text-xs text-flow-500">
              <div className="flex justify-between">
                <span>Status</span>
                <span className={active ? "text-green-400" : "text-flow-600"}>
                  {active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Schedule</span>
                <span>
                  {!startDate && !endDate
                    ? "Always"
                    : `${startDate ? new Date(startDate).toLocaleDateString() : "Now"} — ${endDate ? new Date(endDate).toLocaleDateString() : "No end"}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Visibility</span>
                <span className={live ? "text-green-400" : "text-flow-600"}>
                  {live ? "Currently live" : "Not showing"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

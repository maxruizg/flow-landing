import { json } from "@remix-run/node";
import type { MetaFunction, ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useNavigation, useActionData } from "@remix-run/react";
import { requireAdmin } from "~/lib/session.server";
import { motion } from "framer-motion";
import { useState, useMemo, useRef } from "react";
import { cn } from "~/lib/utils";
import {
  getSubscribersWithTags,
  getSubscriberCount,
  addSubscriber,
  updateSubscriber,
} from "~/data/queries.server";

export const meta: MetaFunction = () => [{ title: "FLOW Admin — Subscribers" }];

const inputClass =
  "w-full bg-flow-950 border border-flow-700 rounded-lg px-4 py-3 text-sm text-flow-100 placeholder:text-flow-500 focus:border-accent-500 focus:outline-none transition-colors";
const labelClass = "block text-xs text-flow-400 mb-1.5 uppercase tracking-wide";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  const [subscribers, activeCount] = await Promise.all([
    getSubscribersWithTags(),
    getSubscriberCount(),
  ]);
  return json({ subscribers, activeCount });
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAdmin(request);
  const form = await request.formData();
  const intent = form.get("intent") as string;

  if (intent === "add-subscriber") {
    const email = (form.get("email") as string)?.trim().toLowerCase();
    const name = (form.get("name") as string)?.trim() || null;
    const tagsRaw = (form.get("tags") as string)?.trim() || "";
    const tags = tagsRaw
      ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    if (!email) {
      return json({ intent, error: "Email is required" }, { status: 400 });
    }

    const result = await addSubscriber(email);
    if (!result.success) {
      return json({ intent, error: result.error || "Failed to add subscriber" }, { status: 400 });
    }

    // If we have name or tags, find the subscriber and update
    if (name || tags.length > 0) {
      const allSubs = await getSubscribersWithTags();
      const sub = allSubs.find((s: any) => s.email === email);
      if (sub) {
        const updates: { name?: string; tags?: string[] } = {};
        if (name) updates.name = name;
        if (tags.length > 0) updates.tags = tags;
        await updateSubscriber(sub.id, updates);
      }
    }

    return json({ intent, success: true, message: `Added ${email}` });
  }

  if (intent === "toggle-active") {
    const id = form.get("id") as string;
    const active = form.get("active") === "true";
    await updateSubscriber(id, { active: !active });
    return json({ intent, success: true });
  }

  if (intent === "update-tags") {
    const id = form.get("id") as string;
    const tagsRaw = (form.get("tags") as string)?.trim() || "";
    const tags = tagsRaw
      ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
    await updateSubscriber(id, { tags });
    return json({ intent, success: true });
  }

  if (intent === "import-csv") {
    const csvData = form.get("csvData") as string;
    if (!csvData) {
      return json({ intent, error: "No CSV data provided" }, { status: 400 });
    }

    const lines = csvData.split("\n").map((l) => l.trim()).filter(Boolean);
    let imported = 0;
    let skipped = 0;

    for (const line of lines) {
      const parts = line.split(",").map((p) => p.trim());
      const email = parts[0]?.toLowerCase();
      if (!email || !email.includes("@")) {
        skipped++;
        continue;
      }

      const name = parts[1] || null;
      const tags = parts.slice(2).filter(Boolean);

      const result = await addSubscriber(email);
      if (result.success) {
        imported++;
        if (name || tags.length > 0) {
          const allSubs = await getSubscribersWithTags();
          const sub = allSubs.find((s: any) => s.email === email);
          if (sub) {
            const updates: { name?: string; tags?: string[] } = {};
            if (name) updates.name = name;
            if (tags.length > 0) updates.tags = tags;
            await updateSubscriber(sub.id, updates);
          }
        }
      } else {
        skipped++;
      }
    }

    return json({ intent, success: true, imported, skipped });
  }

  return json({ error: "Unknown intent" }, { status: 400 });
}

// Tag color palette
const TAG_COLORS = [
  "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "bg-green-500/20 text-green-300 border-green-500/30",
  "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "bg-pink-500/20 text-pink-300 border-pink-500/30",
  "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  "bg-rose-500/20 text-rose-300 border-rose-500/30",
  "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
];

function getTagColor(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

export default function AdminSubscribers() {
  const { subscribers, activeCount } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>() as any;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [tagFilter, setTagFilter] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // CSV import state
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [csvRawData, setCsvRawData] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalCount = subscribers.length;
  const inactiveCount = totalCount - activeCount;

  // Collect all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const sub of subscribers) {
      if (sub.tags && Array.isArray(sub.tags)) {
        for (const t of sub.tags) tagSet.add(t);
      }
    }
    return Array.from(tagSet).sort();
  }, [subscribers]);

  // Filtered subscribers
  const filtered = useMemo(() => {
    return subscribers.filter((sub: any) => {
      const matchesSearch =
        !search ||
        sub.email.toLowerCase().includes(search.toLowerCase()) ||
        (sub.name && sub.name.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && sub.active) ||
        (statusFilter === "inactive" && !sub.active);

      const matchesTag =
        !tagFilter ||
        (sub.tags && Array.isArray(sub.tags) && sub.tags.includes(tagFilter));

      return matchesSearch && matchesStatus && matchesTag;
    });
  }, [subscribers, search, statusFilter, tagFilter]);

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      // Skip header row if it looks like one
      const start =
        lines[0]?.toLowerCase().includes("email") ? 1 : 0;
      const rows = lines.slice(start).map((l) => l.split(",").map((p) => p.trim()));
      setCsvRows(rows);
      setCsvRawData(lines.slice(start).join("\n"));
    };
    reader.readAsText(file);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-5">
          <p className="text-xs text-flow-500 uppercase tracking-wide mb-1">Total Subscribers</p>
          <p className="text-2xl font-display font-bold text-white">{totalCount}</p>
        </div>
        <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-5">
          <p className="text-xs text-flow-500 uppercase tracking-wide mb-1">Active</p>
          <p className="text-2xl font-display font-bold text-green-400">{activeCount}</p>
        </div>
        <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-5">
          <p className="text-xs text-flow-500 uppercase tracking-wide mb-1">Inactive</p>
          <p className="text-2xl font-display font-bold text-flow-400">{inactiveCount}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => { setShowAddForm(!showAddForm); setShowImport(false); }}
          className={cn(
            "font-display font-semibold text-sm tracking-wide uppercase rounded-lg px-6 py-3 transition-colors",
            showAddForm
              ? "bg-flow-800 text-white"
              : "bg-white text-flow-black hover:bg-flow-200"
          )}
        >
          {showAddForm ? "Close" : "Add Subscriber"}
        </button>
        <button
          type="button"
          onClick={() => { setShowImport(!showImport); setShowAddForm(false); }}
          className={cn(
            "font-display font-semibold text-sm tracking-wide uppercase rounded-lg px-6 py-3 transition-colors",
            showImport
              ? "bg-flow-800 text-white"
              : "bg-flow-900 border border-flow-700 text-flow-200 hover:bg-flow-800"
          )}
        >
          {showImport ? "Close" : "Import CSV"}
        </button>
      </div>

      {/* Add subscriber form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-flow-900 border border-flow-800/50 rounded-xl p-6"
        >
          <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide mb-4">
            Add Subscriber
          </h2>
          {actionData?.intent === "add-subscriber" && actionData.success && (
            <div className="mb-4 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3">
              <p className="text-sm text-green-400">{actionData.message}</p>
            </div>
          )}
          {actionData?.intent === "add-subscriber" && actionData.error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
              <p className="text-sm text-red-400">{actionData.error}</p>
            </div>
          )}
          <Form method="post" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input type="hidden" name="intent" value="add-subscriber" />
            <div>
              <label className={labelClass}>Email</label>
              <input
                className={inputClass}
                name="email"
                type="email"
                placeholder="user@example.com"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Name</label>
              <input
                className={inputClass}
                name="name"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className={labelClass}>Tags (comma-separated)</label>
              <input
                className={inputClass}
                name="tags"
                placeholder="vip, newsletter, early-access"
              />
            </div>
            <div className="sm:col-span-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-white text-flow-black font-display font-semibold text-sm tracking-wide uppercase rounded-lg px-6 py-3 hover:bg-flow-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Adding..." : "Add"}
              </button>
            </div>
          </Form>
        </motion.div>
      )}

      {/* CSV Import section */}
      {showImport && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-flow-900 border border-flow-800/50 rounded-xl p-6"
        >
          <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide mb-4">
            Import CSV
          </h2>
          <p className="text-xs text-flow-400 mb-4">
            CSV format: <span className="text-flow-300">email, name, tag1, tag2, ...</span> — first row is skipped if it contains "email".
          </p>

          {actionData?.intent === "import-csv" && actionData.success && (
            <div className="mb-4 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3">
              <p className="text-sm text-green-400">
                Imported: {actionData.imported} | Skipped: {actionData.skipped}
              </p>
            </div>
          )}
          {actionData?.intent === "import-csv" && actionData.error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
              <p className="text-sm text-red-400">{actionData.error}</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleCsvFile}
            className="block w-full text-sm text-flow-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-flow-800 file:text-flow-200 hover:file:bg-flow-700 file:cursor-pointer file:transition-colors"
          />

          {csvRows.length > 0 && (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-flow-400 uppercase tracking-wide">
                Preview (first {Math.min(csvRows.length, 5)} of {csvRows.length} rows)
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-flow-800/50">
                      <th className="text-left text-xs text-flow-500 uppercase tracking-wide py-2 px-3">Email</th>
                      <th className="text-left text-xs text-flow-500 uppercase tracking-wide py-2 px-3">Name</th>
                      <th className="text-left text-xs text-flow-500 uppercase tracking-wide py-2 px-3">Tags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvRows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-flow-800/30">
                        <td className="py-2 px-3 text-flow-200">{row[0] || "—"}</td>
                        <td className="py-2 px-3 text-flow-300">{row[1] || "—"}</td>
                        <td className="py-2 px-3 text-flow-400">{row.slice(2).join(", ") || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Form method="post">
                <input type="hidden" name="intent" value="import-csv" />
                <input type="hidden" name="csvData" value={csvRawData} />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-white text-flow-black font-display font-semibold text-sm tracking-wide uppercase rounded-lg px-6 py-3 hover:bg-flow-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Importing..." : `Import ${csvRows.length} Rows`}
                </button>
              </Form>
            </div>
          )}
        </motion.div>
      )}

      {/* Search + filter bar */}
      <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              className={inputClass}
              placeholder="Search by email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className={cn(inputClass, "sm:w-40")}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            className={cn(inputClass, "sm:w-44")}
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
          >
            <option value="">All Tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Subscriber table — desktop */}
      <div className="hidden md:block bg-flow-900 border border-flow-800/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-flow-800/50 bg-flow-950/50">
                <th className="text-left text-xs text-flow-500 uppercase tracking-wide py-3 px-4">Email</th>
                <th className="text-left text-xs text-flow-500 uppercase tracking-wide py-3 px-4">Name</th>
                <th className="text-left text-xs text-flow-500 uppercase tracking-wide py-3 px-4">Tags</th>
                <th className="text-left text-xs text-flow-500 uppercase tracking-wide py-3 px-4">Status</th>
                <th className="text-left text-xs text-flow-500 uppercase tracking-wide py-3 px-4">Subscribed</th>
                <th className="text-left text-xs text-flow-500 uppercase tracking-wide py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-flow-500">
                    No subscribers found.
                  </td>
                </tr>
              ) : (
                filtered.map((sub: any) => (
                  <tr key={sub.id} className="border-b border-flow-800/30 hover:bg-flow-800/20 transition-colors">
                    <td className="py-3 px-4 text-flow-200">{sub.email}</td>
                    <td className="py-3 px-4 text-flow-300">{sub.name || "—"}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {sub.tags && sub.tags.length > 0 ? (
                          sub.tags.map((tag: string) => (
                            <span
                              key={tag}
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border",
                                getTagColor(tag)
                              )}
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-flow-600 text-xs">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Form method="post" className="inline">
                        <input type="hidden" name="intent" value="toggle-active" />
                        <input type="hidden" name="id" value={sub.id} />
                        <input type="hidden" name="active" value={String(sub.active)} />
                        <button
                          type="submit"
                          className={cn(
                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                            sub.active ? "bg-green-500" : "bg-flow-700"
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform",
                              sub.active ? "translate-x-4" : "translate-x-0"
                            )}
                          />
                        </button>
                      </Form>
                    </td>
                    <td className="py-3 px-4 text-flow-400 text-xs">
                      {sub.subscribed_at
                        ? new Date(sub.subscribed_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <TagEditor subscriberId={sub.id} currentTags={sub.tags || []} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscriber cards — mobile */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-6 text-center">
            <p className="text-sm text-flow-500">No subscribers found.</p>
          </div>
        ) : (
          filtered.map((sub: any) => (
            <div
              key={sub.id}
              className="bg-flow-900 border border-flow-800/50 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-flow-100">{sub.email}</p>
                  {sub.name && (
                    <p className="text-xs text-flow-400 mt-0.5">{sub.name}</p>
                  )}
                </div>
                <Form method="post" className="inline">
                  <input type="hidden" name="intent" value="toggle-active" />
                  <input type="hidden" name="id" value={sub.id} />
                  <input type="hidden" name="active" value={String(sub.active)} />
                  <button
                    type="submit"
                    className={cn(
                      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                      sub.active ? "bg-green-500" : "bg-flow-700"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform",
                        sub.active ? "translate-x-4" : "translate-x-0"
                      )}
                    />
                  </button>
                </Form>
              </div>

              {sub.tags && sub.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {sub.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border",
                        getTagColor(tag)
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-flow-500">
                <span>
                  {sub.subscribed_at
                    ? new Date(sub.subscribed_at).toLocaleDateString()
                    : "—"}
                </span>
                <TagEditor subscriberId={sub.id} currentTags={sub.tags || []} />
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

function TagEditor({
  subscriberId,
  currentTags,
}: {
  subscriberId: string;
  currentTags: string[];
}) {
  const [editing, setEditing] = useState(false);
  const [tags, setTags] = useState(currentTags.join(", "));
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs text-flow-500 hover:text-flow-300 transition-colors"
      >
        Edit tags
      </button>
    );
  }

  return (
    <Form
      method="post"
      className="flex items-center gap-2"
      onSubmit={() => setEditing(false)}
    >
      <input type="hidden" name="intent" value="update-tags" />
      <input type="hidden" name="id" value={subscriberId} />
      <input
        className="bg-flow-950 border border-flow-700 rounded px-2 py-1 text-xs text-flow-100 placeholder:text-flow-500 focus:border-accent-500 focus:outline-none w-36"
        name="tags"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="tag1, tag2"
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="text-xs text-green-400 hover:text-green-300 font-medium"
      >
        Save
      </button>
      <button
        type="button"
        onClick={() => { setEditing(false); setTags(currentTags.join(", ")); }}
        className="text-xs text-flow-500 hover:text-flow-300"
      >
        Cancel
      </button>
    </Form>
  );
}

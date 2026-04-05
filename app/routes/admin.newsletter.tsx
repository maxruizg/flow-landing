import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form, useNavigation } from "@remix-run/react";
import type { MetaFunction, ActionFunctionArgs } from "@remix-run/node";
import { motion } from "framer-motion";
import { useState } from "react";
import { getActiveSubscribers, getSubscriberCount } from "~/data/queries.server";
import { getResend } from "~/lib/resend.server";
import { NewDropEmail } from "~/emails/new-drop";

export const meta: MetaFunction = () => [{ title: "FLOW Admin — Newsletter" }];

const inputClass =
  "w-full bg-flow-950 border border-flow-700 rounded-lg px-4 py-3 text-sm text-flow-100 placeholder:text-flow-500 focus:border-accent-500 focus:outline-none transition-colors";
const labelClass = "block text-xs text-flow-400 mb-1.5 uppercase tracking-wide";

export async function loader() {
  const [subscribers, count] = await Promise.all([
    getActiveSubscribers(),
    getSubscriberCount(),
  ]);
  return json({ subscribers, count });
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const subject = (form.get("subject") as string)?.trim();
  const body = (form.get("body") as string)?.trim();

  if (!subject || !body) {
    return json({ error: "Subject and body are required" }, { status: 400 });
  }

  const subscribers = await getActiveSubscribers();
  if (subscribers.length === 0) {
    return json({ error: "No active subscribers" }, { status: 400 });
  }

  const resend = getResend();
  const emails = subscribers.map((s) => s.email);

  // Send in batches of 50
  const BATCH_SIZE = 50;
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);
    await resend.batch.send(
      batch.map((to) => ({
        from: process.env.RESEND_FROM_EMAIL || "Flow Urban Wear <onboarding@resend.dev>",
        to,
        subject,
        react: NewDropEmail({ subject, body }),
      }))
    );
  }

  return redirect("/admin/newsletter?sent=" + emails.length);
}

export default function AdminNewsletter() {
  const { subscribers, count } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  // Check if we just sent
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const sentCount = params?.get("sent");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-5">
          <p className="text-xs text-flow-500 uppercase tracking-wide mb-1">Active Subscribers</p>
          <p className="text-2xl font-display font-bold text-white">{count}</p>
        </div>
        <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-5">
          <p className="text-xs text-flow-500 uppercase tracking-wide mb-1">Status</p>
          <p className="text-sm text-green-400 font-medium mt-1">
            {count > 0 ? "Ready to send" : "No subscribers yet"}
          </p>
        </div>
        <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-5">
          <p className="text-xs text-flow-500 uppercase tracking-wide mb-1">Last Send</p>
          <p className="text-sm text-flow-300 mt-1">
            {sentCount ? `Sent to ${sentCount} subscribers` : "—"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose */}
        <div className="lg:col-span-2">
          <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-6">
            <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide mb-4">
              Compose Email
            </h2>

            {sentCount && (
              <div className="mb-4 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3">
                <p className="text-sm text-green-400">
                  Email sent to {sentCount} subscribers.
                </p>
              </div>
            )}

            <Form method="post" className="space-y-4">
              <div>
                <label className={labelClass}>Subject</label>
                <input
                  className={inputClass}
                  name="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="New Drop: Summer Collection"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Body</label>
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={8}
                  name="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="We just dropped something special..."
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || count === 0}
                className="bg-white text-flow-black font-display font-semibold text-sm tracking-wide uppercase rounded-lg px-6 py-3 hover:bg-flow-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? "Sending..."
                  : `Send to ${count} Subscriber${count !== 1 ? "s" : ""}`}
              </button>
            </Form>
          </div>
        </div>

        {/* Subscribers list */}
        <div>
          <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-6">
            <h2 className="text-sm font-display font-semibold text-white uppercase tracking-wide mb-4">
              Subscribers
            </h2>
            {subscribers.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {subscribers.map((sub: any) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between py-2 border-b border-flow-800/30 last:border-0"
                  >
                    <p className="text-sm text-flow-300 truncate">{sub.email}</p>
                    <span className="text-[10px] text-flow-600 shrink-0 ml-2">
                      {new Date(sub.subscribedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-flow-500 py-4 text-center">
                No subscribers yet. They'll appear here when users sign up via the newsletter form.
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

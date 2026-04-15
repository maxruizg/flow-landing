import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { motion } from "framer-motion";
import { getAdminByEmail } from "~/data/queries.server";
import { verifyPassword } from "~/lib/auth.server";
import { createAdminSession, getAdminSession } from "~/lib/session.server";

export const meta: MetaFunction = () => [
  { title: "FLOW Admin — Sign In" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const { adminId } = await getAdminSession(request);
  if (adminId) return redirect("/admin/dashboard");
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const email = (form.get("email") as string || "").trim();
  const password = form.get("password") as string || "";

  if (!email || !password) {
    return json({ error: "Email and password are required" }, { status: 400 });
  }

  const admin = await getAdminByEmail(email);
  if (!admin || !verifyPassword(password, admin.password_hash)) {
    return json({ error: "Invalid email or password" }, { status: 401 });
  }

  return createAdminSession(admin.id, admin.name);
}

export default function AdminLogin() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="bg-flow-900 border border-flow-800/50 rounded-xl p-8">
          <div className="text-center mb-8">
            <h1 className="font-display text-xl font-bold tracking-[0.2em] text-white mb-2">
              FLOW
            </h1>
            <p className="text-flow-500 text-xs tracking-wide uppercase">
              Admin Portal
            </p>
          </div>

          {actionData?.error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-xs text-red-400 text-center">{actionData.error}</p>
            </div>
          )}

          <Form method="post" className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs text-flow-400 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@flowurbanwear.com"
                className="w-full bg-flow-950 border border-flow-700 rounded-lg px-4 py-3 text-sm text-flow-100 placeholder:text-flow-500 focus:border-accent-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs text-flow-400 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-flow-950 border border-flow-700 rounded-lg px-4 py-3 text-sm text-flow-100 placeholder:text-flow-500 focus:border-accent-500 focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-white text-flow-black font-display font-semibold text-sm tracking-wide uppercase rounded-lg px-6 py-3 hover:bg-flow-200 transition-colors mt-2"
            >
              Sign In
            </button>
          </Form>
        </div>
      </motion.div>
    </div>
  );
}

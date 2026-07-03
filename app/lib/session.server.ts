import { createCookieSessionStorage, redirect } from "@remix-run/node";
import type { SessionStorage } from "@remix-run/node";
import { supabase } from "~/lib/supabase.server";

// Lazy so a missing SESSION_SECRET only breaks admin-session operations, not
// the whole server bundle: Remix bundles every route into one module graph,
// so a module-level throw here would 500 the entire storefront.
let _sessionStorage: SessionStorage | null = null;

function getSessionStorage(): SessionStorage {
  if (_sessionStorage) return _sessionStorage;

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret && process.env.NODE_ENV === "production") {
    // A predictable fallback secret would make admin session cookies forgeable.
    throw new Error(
      "SESSION_SECRET environment variable must be set in production — admin sessions are disabled until it is.",
    );
  }

  _sessionStorage = createCookieSessionStorage({
    cookie: {
      name: "__flow_admin",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
      sameSite: "lax",
      secrets: [sessionSecret || "dev-secret-change-in-production"],
      secure: process.env.NODE_ENV === "production",
    },
  });
  return _sessionStorage;
}

export async function createAdminSession(adminId: string, adminName: string) {
  const session = await getSessionStorage().getSession();
  session.set("adminId", adminId);
  session.set("adminName", adminName);
  return redirect("/admin/dashboard", {
    headers: { "Set-Cookie": await getSessionStorage().commitSession(session) },
  });
}

export async function getAdminSession(request: Request) {
  const session = await getSessionStorage().getSession(request.headers.get("Cookie"));
  return {
    adminId: session.get("adminId") as string | undefined,
    adminName: session.get("adminName") as string | undefined,
  };
}

export async function requireAdmin(request: Request) {
  const { adminId, adminName } = await getAdminSession(request);
  if (!adminId) {
    throw redirect("/admin");
  }

  // Verify the admin still exists — a signed cookie alone is not enough if
  // the admin row has been removed (revoked access, deleted account).
  const { data: admin, error } = await supabase
    .from("admins")
    .select("id")
    .eq("id", adminId)
    .maybeSingle();

  if (error || !admin) {
    const session = await getSessionStorage().getSession(
      request.headers.get("Cookie"),
    );
    throw redirect("/admin", {
      headers: { "Set-Cookie": await getSessionStorage().destroySession(session) },
    });
  }

  return { adminId, adminName: adminName || "Admin" };
}

export async function destroyAdminSession(request: Request) {
  const session = await getSessionStorage().getSession(request.headers.get("Cookie"));
  return redirect("/admin", {
    headers: { "Set-Cookie": await getSessionStorage().destroySession(session) },
  });
}

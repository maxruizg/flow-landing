import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { supabase } from "~/lib/supabase.server";

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret && process.env.NODE_ENV === "production") {
  // A predictable fallback secret would make admin session cookies forgeable.
  throw new Error(
    "SESSION_SECRET environment variable must be set in production.",
  );
}

const sessionStorage = createCookieSessionStorage({
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

export async function createAdminSession(adminId: string, adminName: string) {
  const session = await sessionStorage.getSession();
  session.set("adminId", adminId);
  session.set("adminName", adminName);
  return redirect("/admin/dashboard", {
    headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
  });
}

export async function getAdminSession(request: Request) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
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
    const session = await sessionStorage.getSession(
      request.headers.get("Cookie"),
    );
    throw redirect("/admin", {
      headers: { "Set-Cookie": await sessionStorage.destroySession(session) },
    });
  }

  return { adminId, adminName: adminName || "Admin" };
}

export async function destroyAdminSession(request: Request) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  return redirect("/admin", {
    headers: { "Set-Cookie": await sessionStorage.destroySession(session) },
  });
}

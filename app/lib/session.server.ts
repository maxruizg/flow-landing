import { createCookieSessionStorage, redirect } from "@remix-run/node";

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__flow_admin",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET || "dev-secret-change-in-production"],
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
  return { adminId, adminName: adminName || "Admin" };
}

export async function destroyAdminSession(request: Request) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  return redirect("/admin", {
    headers: { "Set-Cookie": await sessionStorage.destroySession(session) },
  });
}

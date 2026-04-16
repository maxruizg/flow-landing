import {
  createCookieSessionStorage,
  json,
  redirect,
} from "@remix-run/node";

export type ToastKind = "success" | "error" | "info";
export interface Toast {
  type: ToastKind;
  message: string;
}

const FLASH_KEY = "flashToast";

const flashStorage = createCookieSessionStorage<{ [FLASH_KEY]?: Toast }>({
  cookie: {
    name: "__flow_flash",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60,
    secrets: [process.env.SESSION_SECRET || "dev-secret-change-in-production"],
    secure: process.env.NODE_ENV === "production",
  },
});

async function commitWithToast(toast: Toast): Promise<string> {
  const session = await flashStorage.getSession();
  session.flash(FLASH_KEY, toast);
  return flashStorage.commitSession(session);
}

export async function getFlashToast(
  request: Request,
): Promise<{ toast: Toast | null; commit: string | null }> {
  const session = await flashStorage.getSession(request.headers.get("Cookie"));
  const toast = session.get(FLASH_KEY) ?? null;
  if (!toast) return { toast: null, commit: null };
  return { toast, commit: await flashStorage.commitSession(session) };
}

export async function redirectWithToast(
  url: string,
  toast: Toast,
  init: ResponseInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.append("Set-Cookie", await commitWithToast(toast));
  return redirect(url, { ...init, headers });
}

export async function jsonWithToast<T>(
  data: T,
  toast: Toast,
  init: ResponseInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.append("Set-Cookie", await commitWithToast(toast));
  return json(data, { ...init, headers });
}

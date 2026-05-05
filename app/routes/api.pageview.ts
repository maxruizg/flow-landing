import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getOrCreateVisitorId } from "~/lib/cookies.server";
import { recordPageView } from "~/data/queries.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ ok: false }, { status: 405 });
  }

  const url = new URL(request.url);
  const path = url.searchParams.get("path") ?? "/";

  if (
    path.startsWith("/admin") ||
    path.startsWith("/api") ||
    path.startsWith("/build") ||
    path.startsWith("/assets") ||
    path.startsWith("/_")
  ) {
    return json({ ok: true, skipped: true });
  }

  const visitor = await getOrCreateVisitorId(request);

  void recordPageView({
    visitorId: visitor.visitorId,
    path,
    referrer: request.headers.get("Referer"),
    userAgent: request.headers.get("User-Agent"),
  });

  const headers: HeadersInit = visitor.setCookie
    ? { "Set-Cookie": visitor.setCookie }
    : {};
  return json({ ok: true }, { headers });
}

export function loader() {
  return json({ ok: false }, { status: 405 });
}

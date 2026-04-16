import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import {
  clearPersonalizationCookies,
  getConsent,
  serializeConsent,
  type CookieConsent,
} from "~/lib/cookies.server";

export async function loader({ request }: LoaderFunctionArgs) {
  return json({ consent: await getConsent(request) });
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const form = await request.formData();
  const raw = form.get("consent");
  if (typeof raw !== "string") {
    return json({ error: "Missing consent payload" }, { status: 400 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!parsed || typeof parsed !== "object") {
    return json({ error: "Invalid consent shape" }, { status: 400 });
  }

  const incoming = parsed as Partial<CookieConsent>;
  const consent: CookieConsent = {
    analytics: Boolean(incoming.analytics),
    marketing: Boolean(incoming.marketing),
    personalization: Boolean(incoming.personalization),
  };

  const headers = new Headers();
  headers.append("Set-Cookie", await serializeConsent(consent));

  // If the user withdrew personalization, purge any personalization cookies
  // that may already be set so stale data doesn't outlive the consent.
  const previous = await getConsent(request);
  if (previous?.personalization && !consent.personalization) {
    for (const cookie of await clearPersonalizationCookies()) {
      headers.append("Set-Cookie", cookie);
    }
  }

  return json({ ok: true as const, consent }, { headers });
}

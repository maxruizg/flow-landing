import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import {
  resolveLocale,
  serializeCountry,
  serializeCurrency,
  serializeLanguage,
} from "~/lib/cookies.server";

export async function loader({ request }: LoaderFunctionArgs) {
  return json({ locale: await resolveLocale(request) });
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const form = await request.formData();
  const currency = form.get("currency");
  const language = form.get("language");
  const country = form.get("country");

  const headers = new Headers();

  if (currency === "USD" || currency === "MXN") {
    headers.append("Set-Cookie", await serializeCurrency(currency));
  }
  if (language === "en" || language === "es") {
    headers.append("Set-Cookie", await serializeLanguage(language));
  }
  if (country === "US" || country === "MX") {
    headers.append("Set-Cookie", await serializeCountry(country));
  }

  return json({ ok: true as const }, { headers });
}

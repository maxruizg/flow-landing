import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { addSubscriber } from "~/data/queries.server";
import { checkRateLimit, getClientIp } from "~/lib/rate-limit.server";

export async function action({ request }: ActionFunctionArgs) {
  const rl = await checkRateLimit(`subscribe:${getClientIp(request)}`, 5, 60);
  if (!rl.allowed) {
    return json(
      { success: false, error: "Too many attempts — please try again in a minute." },
      { status: 429 },
    );
  }

  const form = await request.formData();
  const email = (form.get("email") as string)?.trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ success: false, error: "Please enter a valid email" }, { status: 400 });
  }

  const result = await addSubscriber(email);
  if (!result.success) {
    return json({ success: false, error: result.error }, { status: 500 });
  }

  return json({ success: true });
}

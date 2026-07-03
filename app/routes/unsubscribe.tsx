import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { supabase } from "~/lib/supabase.server";
import { checkRateLimit, getClientIp } from "~/lib/rate-limit.server";
import { SITE_URL } from "~/lib/seo";

export const meta: MetaFunction = () => [
  { title: "Cancelar suscripción — FLOW Urban Wear" },
  { name: "robots", content: "noindex" },
  { tagName: "link", rel: "canonical", href: `${SITE_URL}/unsubscribe` },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const email = new URL(request.url).searchParams.get("email") ?? "";
  return json({ email });
}

async function deactivateSubscriber(email: string) {
  // Deliberately fire-and-forget semantics for the caller: the page always
  // confirms success so it can't be used to probe which emails exist.
  const { error } = await supabase
    .from("subscribers")
    .update({ active: false })
    .eq("email", email.toLowerCase());
  if (error) console.warn("[unsubscribe] update failed:", error.message);
}

export async function action({ request }: ActionFunctionArgs) {
  const ip = getClientIp(request);
  const { allowed } = await checkRateLimit(`unsubscribe:${ip}`, 10, 60);
  if (!allowed) {
    return json(
      { done: false, error: "Demasiados intentos. Espera un minuto e inténtalo de nuevo." },
      { status: 429 },
    );
  }

  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!valid) {
    return json({ done: false, error: "Escribe un correo válido." }, { status: 400 });
  }

  await deactivateSubscriber(email);
  return json({ done: true, error: null });
}

export default function Unsubscribe() {
  const { email } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submitting = navigation.state !== "idle";

  return (
    <main className="min-h-screen bg-flow-black text-flow-100 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center py-24">
        <p className="text-xs tracking-[0.3em] uppercase text-flow-100/50 mb-4">
          FLOW Urban Wear
        </p>
        {actionData?.done ? (
          <>
            <h1 className="font-display text-3xl uppercase mb-4">Listo</h1>
            <p className="text-flow-100/70">
              No volverás a recibir correos de marketing de FLOW. Si cambias de
              opinión, siempre puedes volver a suscribirte desde el sitio.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl uppercase mb-4">
              Cancelar suscripción
            </h1>
            <p className="text-flow-100/70 mb-8">
              Escribe tu correo y dejaremos de enviarte novedades y promociones.
            </p>
            <Form method="post" className="flex flex-col gap-3">
              <input
                type="email"
                name="email"
                required
                defaultValue={email}
                placeholder="tu@correo.com"
                className="w-full bg-transparent border border-flow-100/20 rounded-lg px-4 py-3 text-flow-100 placeholder:text-flow-100/30 focus:outline-none focus:border-flow-100/60"
              />
              {actionData?.error && (
                <p className="text-red-400 text-sm">{actionData.error}</p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-flow-100 text-flow-black rounded-lg px-4 py-3 font-medium uppercase tracking-wider hover:bg-white transition-colors disabled:opacity-50"
              >
                {submitting ? "Procesando..." : "Cancelar suscripción"}
              </button>
            </Form>
          </>
        )}
      </div>
    </main>
  );
}

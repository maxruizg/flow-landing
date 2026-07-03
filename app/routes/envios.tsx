import { Navbar } from "~/components/layout/Navbar";
import { Footer } from "~/components/layout/Footer";
import { Container } from "~/components/ui/Container";
import { JsonLdScript } from "~/components/seo/JsonLdScript";
import { shippingEs, shippingFaqEs, contactEmail } from "~/data/brand";
import { SITE_URL, DEFAULT_OG_IMAGE } from "~/lib/seo";
import type { HeadersFunction, MetaFunction } from "@remix-run/node";

// NOTE: Spanish-only for now (the site's primary language). Localizing this
// page through LocaleContext/EN dictionaries is a future refinement.

const PAGE_URL = `${SITE_URL}/envios`;
const PAGE_TITLE = "Envíos — FLOW Urban Wear";
const PAGE_DESC =
  "Envíos vía DHL desde Ciudad de México: 4–6 días hábiles en CDMX, 5–7 a todo México y 10–14 internacionales. Rastreo con guía DHL incluido.";

// Same parent-meta filtering pattern as showroom.tsx to avoid duplicate tags.
const OVERRIDE_NAMES = new Set(["description", "twitter:title", "twitter:description"]);
const OVERRIDE_PROPS = new Set(["og:title", "og:description", "og:url", "og:image"]);

export const meta: MetaFunction = ({ matches }) => {
  const parentMeta = matches.flatMap((m) => m.meta ?? []);
  const filtered = parentMeta.filter((tag) => {
    const t = tag as { title?: string; name?: string; property?: string };
    if (t.title !== undefined) return false;
    if (t.name && OVERRIDE_NAMES.has(t.name)) return false;
    if (t.property && OVERRIDE_PROPS.has(t.property)) return false;
    return true;
  });

  return [
    ...filtered,
    { title: PAGE_TITLE },
    { name: "description", content: PAGE_DESC },
    { tagName: "link", rel: "canonical", href: PAGE_URL },
    { property: "og:title", content: PAGE_TITLE },
    { property: "og:description", content: PAGE_DESC },
    { property: "og:url", content: PAGE_URL },
    { property: "og:image", content: DEFAULT_OG_IMAGE },
    { name: "twitter:title", content: PAGE_TITLE },
    { name: "twitter:description", content: PAGE_DESC },
  ];
};

export const headers: HeadersFunction = () => ({
  "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
});

function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: shippingFaqEs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

const DELIVERY_TIMES = [
  { zone: "CDMX y área metropolitana", time: shippingEs.cdmx },
  { zone: "Resto de México", time: shippingEs.national },
  { zone: "Internacional", time: shippingEs.international },
];

export default function Envios() {
  return (
    <div id="main-content" className="bg-flow-black min-h-screen">
      <Navbar />
      <JsonLdScript data={faqJsonLd()} />

      <main className="pt-32 md:pt-40 pb-24">
        <Container className="max-w-3xl">
          {/* Header */}
          <span className="block text-xs uppercase tracking-[0.3em] text-flow-400 mb-4">
            Envíos
          </span>
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight text-white mb-6">
            De CDMX a tu puerta
          </h1>
          <p className="text-base md:text-lg text-flow-300 leading-relaxed mb-16">
            Todos los pedidos salen desde {shippingEs.origin} vía{" "}
            {shippingEs.carrier}, con número de guía para que sigas tu paquete
            en todo momento.
          </p>

          <div className="space-y-14">
            {/* Delivery times */}
            <section aria-labelledby="tiempos">
              <h2
                id="tiempos"
                className="text-xs uppercase tracking-[0.25em] text-white font-medium mb-4"
              >
                Tiempos de entrega
              </h2>
              <ul className="divide-y divide-flow-800 border-y border-flow-800">
                {DELIVERY_TIMES.map((row) => (
                  <li
                    key={row.zone}
                    className="flex justify-between gap-4 py-4 text-sm md:text-base"
                  >
                    <span className="text-flow-300">{row.zone}</span>
                    <span className="text-white whitespace-nowrap">{row.time}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-flow-500 leading-relaxed">
                Los tiempos son estimados en días hábiles a partir de que tu
                pedido sale de nuestro estudio y pueden variar en temporada
                alta o por causas ajenas a la paquetería.
              </p>
            </section>

            {/* Tracking */}
            <section aria-labelledby="rastreo">
              <h2
                id="rastreo"
                className="text-xs uppercase tracking-[0.25em] text-white font-medium mb-4"
              >
                Rastreo
              </h2>
              <p className="text-sm md:text-base text-flow-300 leading-relaxed">
                Cuando tu paquete sale, te enviamos por correo tu número de
                guía DHL. Con él puedes seguir tu pedido en tiempo real en{" "}
                <a
                  href="https://www.dhl.com/mx-es/home/rastreo.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white underline underline-offset-4 hover:text-flow-200 transition-colors"
                >
                  dhl.com
                </a>{" "}
                o en la app de DHL.
              </p>
            </section>

            {/* FAQ */}
            <section aria-labelledby="faq-envios">
              <h2
                id="faq-envios"
                className="text-xs uppercase tracking-[0.25em] text-white font-medium mb-6"
              >
                Preguntas frecuentes
              </h2>
              <div className="space-y-8">
                {shippingFaqEs.map((item) => (
                  <div key={item.question}>
                    <h3 className="text-sm md:text-base text-white font-medium mb-2">
                      {item.question}
                    </h3>
                    <p className="text-sm md:text-base text-flow-300 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Contact */}
            <section aria-labelledby="dudas-envios">
              <h2
                id="dudas-envios"
                className="text-xs uppercase tracking-[0.25em] text-white font-medium mb-4"
              >
                ¿Dudas con tu pedido?
              </h2>
              <p className="text-sm md:text-base text-flow-300 leading-relaxed">
                Escríbenos a{" "}
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-white underline underline-offset-4 hover:text-flow-200 transition-colors"
                >
                  {contactEmail}
                </a>{" "}
                con tu número de pedido y te ayudamos.
              </p>
            </section>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}

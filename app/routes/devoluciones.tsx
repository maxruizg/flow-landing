import { Navbar } from "~/components/layout/Navbar";
import { Footer } from "~/components/layout/Footer";
import { Container } from "~/components/ui/Container";
import { JsonLdScript } from "~/components/seo/JsonLdScript";
import { returnsEs, returnsFaqEs, contactEmail } from "~/data/brand";
import { SITE_URL, DEFAULT_OG_IMAGE } from "~/lib/seo";
import type { HeadersFunction, MetaFunction } from "@remix-run/node";

// NOTE: Spanish-only for now (the site's primary language). Localizing this
// page through LocaleContext/EN dictionaries is a future refinement.

const PAGE_URL = `${SITE_URL}/devoluciones`;
const PAGE_TITLE = "Devoluciones y cambios — FLOW Urban Wear";
const PAGE_DESC =
  "Política de devoluciones de FLOW Urban Wear: 10 días para devoluciones con reembolso y 7 días para cambios. Conoce las condiciones y cómo iniciar tu solicitud.";

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
    mainEntity: returnsFaqEs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export default function Devoluciones() {
  return (
    <div id="main-content" className="bg-flow-black min-h-screen">
      <Navbar />
      <JsonLdScript data={faqJsonLd()} />

      <main className="pt-32 md:pt-40 pb-24">
        <Container className="max-w-3xl">
          {/* Header */}
          <span className="block text-xs uppercase tracking-[0.3em] text-flow-400 mb-4">
            Devoluciones y cambios
          </span>
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight text-white mb-6">
            Si no fluyó, lo resolvemos
          </h1>
          <p className="text-base md:text-lg text-flow-300 leading-relaxed mb-16">
            ¿La talla no fue la correcta o el producto no era lo que
            esperabas? Aquí está todo lo que necesitas saber para devolverlo o
            cambiarlo.
          </p>

          <div className="space-y-14">
            {/* Windows */}
            <section aria-labelledby="plazos">
              <h2
                id="plazos"
                className="text-xs uppercase tracking-[0.25em] text-white font-medium mb-4"
              >
                Plazos
              </h2>
              <ul className="divide-y divide-flow-800 border-y border-flow-800">
                <li className="flex justify-between gap-4 py-4 text-sm md:text-base">
                  <span className="text-flow-300">Devolución con reembolso</span>
                  <span className="text-white whitespace-nowrap">10 días naturales</span>
                </li>
                <li className="flex justify-between gap-4 py-4 text-sm md:text-base">
                  <span className="text-flow-300">Cambio de talla o producto</span>
                  <span className="text-white whitespace-nowrap">7 días naturales</span>
                </li>
              </ul>
              <p className="mt-4 text-xs text-flow-500 leading-relaxed">
                Ambos plazos corren a partir del día en que recibes tu pedido.
              </p>
            </section>

            {/* Conditions */}
            <section aria-labelledby="condiciones">
              <h2
                id="condiciones"
                className="text-xs uppercase tracking-[0.25em] text-white font-medium mb-4"
              >
                Condiciones
              </h2>
              <p className="text-sm md:text-base text-flow-300 leading-relaxed mb-4">
                Para aceptar una devolución o cambio, la prenda debe estar en
                su estado original: sin usar, sin lavar y con sus etiquetas.
                No podemos aceptar:
              </p>
              <ul className="space-y-2 text-sm md:text-base text-flow-300">
                {returnsEs.nonReturnable.map((condition) => (
                  <li key={condition} className="flex items-start gap-3">
                    <span className="text-flow-600 mt-1">—</span>
                    <span>{condition}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* How to */}
            <section aria-labelledby="como-devolver">
              <h2
                id="como-devolver"
                className="text-xs uppercase tracking-[0.25em] text-white font-medium mb-4"
              >
                Cómo iniciar tu devolución o cambio
              </h2>
              <ol className="space-y-4 text-sm md:text-base text-flow-300 leading-relaxed">
                <li className="flex items-start gap-3">
                  <span className="text-white font-medium">1.</span>
                  <span>
                    Escríbenos a{" "}
                    <a
                      href={`mailto:${contactEmail}`}
                      className="text-white underline underline-offset-4 hover:text-flow-200 transition-colors"
                    >
                      {contactEmail}
                    </a>{" "}
                    con tu número de pedido y el motivo.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-white font-medium">2.</span>
                  <span>
                    Te respondemos con las instrucciones y la guía de envío
                    correspondiente.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-white font-medium">3.</span>
                  <span>
                    Al recibir e inspeccionar la prenda, procesamos tu
                    reembolso o enviamos tu cambio.
                  </span>
                </li>
              </ol>
            </section>

            {/* FAQ */}
            <section aria-labelledby="faq-devoluciones">
              <h2
                id="faq-devoluciones"
                className="text-xs uppercase tracking-[0.25em] text-white font-medium mb-6"
              >
                Preguntas frecuentes
              </h2>
              <div className="space-y-8">
                {returnsFaqEs.map((item) => (
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
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}

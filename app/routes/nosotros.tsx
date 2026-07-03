import { Navbar } from "~/components/layout/Navbar";
import { Footer } from "~/components/layout/Footer";
import { Container } from "~/components/ui/Container";
import { brand } from "~/data/brand";
import { SITE_URL, DEFAULT_OG_IMAGE } from "~/lib/seo";
import type { HeadersFunction, MetaFunction } from "@remix-run/node";

// NOTE: Spanish-only for now (the site's primary language). Localizing this
// page through LocaleContext/EN dictionaries is a future refinement.

const PAGE_URL = `${SITE_URL}/nosotros`;
const PAGE_TITLE = "Nosotros — La historia de FLOW Urban Wear";
const PAGE_DESC =
  "Conoce la historia de FLOW Urban Wear: la marca de streetwear creada por Dany Flow en Ciudad de México. Less Thinking More Flow.";

// Tag identifiers we redefine for this route — filter them out of the parent
// meta before re-adding so the head doesn't end up with duplicates (same
// pattern as showroom.tsx).
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

export default function Nosotros() {
  return (
    <div id="main-content" className="bg-flow-black min-h-screen">
      <Navbar />

      <main className="pt-32 md:pt-40 pb-24">
        <Container className="max-w-3xl">
          {/* Header */}
          <span className="block text-xs uppercase tracking-[0.3em] text-flow-400 mb-4">
            Nosotros
          </span>
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight text-white mb-6">
            Less Thinking
            <br />
            More Flow
          </h1>
          <p className="text-base md:text-lg text-flow-300 leading-relaxed mb-16">
            Streetwear de comunidad, nacido en Ciudad de México. Más que ropa:
            una forma de moverse por el mundo.
          </p>

          <div className="space-y-14">
            {/* Story */}
            <section aria-labelledby="historia">
              <h2
                id="historia"
                className="text-xs uppercase tracking-[0.25em] text-white font-medium mb-4"
              >
                Nuestra historia
              </h2>
              <div className="space-y-4 text-sm md:text-base text-flow-300 leading-relaxed">
                <p>
                  FLOW URBAN WEAR nació de la mano de{" "}
                  <span className="text-white font-medium">DANY FLOW</span>, el
                  apodo de Daniela Flores: Flores se volvió{" "}
                  <em className="not-italic text-flow-200">Flowers</em>, y
                  Flowers se volvió <em className="not-italic text-flow-200">FLOW</em>.
                </p>
                <p>
                  Lo que empezó como una forma de expresión personal se
                  convirtió en una marca de streetwear con comunidad, que mezcla
                  la cultura urbana de la Ciudad de México con un toque moderno.
                  FLOW es más que estilo: es autoexpresión, creatividad y
                  autenticidad.
                </p>
                <p>
                  <span className="text-white font-medium">{brand.tagline}</span>{" "}
                  — el arte de dejar que las cosas pasen, sin intentar
                  controlarlas.
                </p>
              </div>
            </section>

            {/* Values */}
            <section aria-labelledby="valores">
              <h2
                id="valores"
                className="text-xs uppercase tracking-[0.25em] text-white font-medium mb-4"
              >
                Lo que nos mueve
              </h2>
              <ul className="space-y-4 text-sm md:text-base text-flow-300 leading-relaxed">
                <li className="flex items-start gap-3">
                  <span className="text-flow-600 mt-1">—</span>
                  <span>
                    <span className="text-white">Autoexpresión.</span> Cada
                    pieza está pensada para que la hagas tuya, no para que te
                    disfraces de alguien más.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-flow-600 mt-1">—</span>
                  <span>
                    <span className="text-white">Comunidad.</span> FLOW crece
                    con la gente que lo usa: la calle, los amigos, la escena de
                    CDMX.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-flow-600 mt-1">—</span>
                  <span>
                    <span className="text-white">Autenticidad.</span> Sin poses
                    ni fórmulas: diseño honesto, con identidad propia.
                  </span>
                </li>
              </ul>
            </section>

            {/* What we make */}
            <section aria-labelledby="que-hacemos">
              <h2
                id="que-hacemos"
                className="text-xs uppercase tracking-[0.25em] text-white font-medium mb-4"
              >
                Lo que hacemos
              </h2>
              <p className="text-sm md:text-base text-flow-300 leading-relaxed">
                Streetwear con raíz en la cultura de la Ciudad de México:
                hoodies, playeras, crop tops, shorts y accesorios diseñados
                para quienes se mueven con intención. Diseñado y hecho en
                México, con materiales elegidos para durar y envíos que salen
                directo desde CDMX.
              </p>
            </section>

            {/* Based in */}
            <section aria-labelledby="donde-estamos">
              <h2
                id="donde-estamos"
                className="text-xs uppercase tracking-[0.25em] text-white font-medium mb-4"
              >
                Dónde estamos
              </h2>
              <p className="text-sm md:text-base text-flow-300 leading-relaxed">
                Ciudad de México, México.
              </p>
            </section>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}

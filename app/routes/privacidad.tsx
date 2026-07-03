import { Navbar } from "~/components/layout/Navbar";
import { Footer } from "~/components/layout/Footer";
import { Container } from "~/components/ui/Container";
import { contactEmail } from "~/data/brand";
import { SITE_URL, DEFAULT_OG_IMAGE, ORG_NAME } from "~/lib/seo";
import type { HeadersFunction, MetaFunction } from "@remix-run/node";

// Aviso de Privacidad conforme a la Ley Federal de Protección de Datos
// Personales en Posesión de los Particulares (LFPDPPP).
//
// TODO(owner): reemplazar el domicilio genérico de RESPONSABLE_DOMICILIO por
// la calle, número, colonia y código postal reales del responsable antes de
// considerar este aviso completo. La LFPDPPP exige el domicilio del
// responsable (art. 16, fracción I).
const RESPONSABLE_DOMICILIO = "Ciudad de México, México";
const ULTIMA_ACTUALIZACION = "2 de julio de 2026";

// NOTE: Spanish-only for now (the site's primary language). Localizing this
// page through LocaleContext/EN dictionaries is a future refinement.

const PAGE_URL = `${SITE_URL}/privacidad`;
const PAGE_TITLE = "Aviso de Privacidad — FLOW Urban Wear";
const PAGE_DESC =
  "Aviso de Privacidad de FLOW URBAN WEAR conforme a la LFPDPPP: qué datos personales recabamos, con qué finalidades, transferencias y cómo ejercer tus derechos ARCO.";

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

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-xs uppercase tracking-[0.25em] text-white font-medium mb-4">
      {children}
    </h2>
  );
}

function ListItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="text-flow-600 mt-1">—</span>
      <span>{children}</span>
    </li>
  );
}

const bodyText = "text-sm md:text-base text-flow-300 leading-relaxed";

export default function Privacidad() {
  return (
    <div id="main-content" className="bg-flow-black min-h-screen">
      <Navbar />

      <main className="pt-32 md:pt-40 pb-24">
        <Container className="max-w-3xl">
          {/* Header */}
          <span className="block text-xs uppercase tracking-[0.3em] text-flow-400 mb-4">
            Legal
          </span>
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight text-white mb-6">
            Aviso de Privacidad
          </h1>
          <p className="text-base md:text-lg text-flow-300 leading-relaxed mb-2">
            En cumplimiento con la Ley Federal de Protección de Datos
            Personales en Posesión de los Particulares (LFPDPPP), su
            Reglamento y los Lineamientos del Aviso de Privacidad.
          </p>
          <p className="text-xs text-flow-500 mb-16">
            Última actualización: {ULTIMA_ACTUALIZACION}
          </p>

          <div className="space-y-14">
            {/* 1. Responsable */}
            <section aria-labelledby="responsable">
              <SectionTitle id="responsable">
                1. Identidad y domicilio del responsable
              </SectionTitle>
              <p className={bodyText}>
                <span className="text-white font-medium">{ORG_NAME}</span> (en
                adelante, “FLOW”), con domicilio en {RESPONSABLE_DOMICILIO}, es
                el responsable del tratamiento de tus datos personales, del uso
                que se les dé y de su protección, conforme a este Aviso de
                Privacidad.
              </p>
            </section>

            {/* 2. Datos recabados */}
            <section aria-labelledby="datos">
              <SectionTitle id="datos">
                2. Datos personales que recabamos
              </SectionTitle>
              <p className={`${bodyText} mb-4`}>
                Para las finalidades señaladas en este aviso podemos recabar
                los siguientes datos personales, de manera directa cuando nos
                los proporcionas al comprar en nuestra tienda en línea o
                suscribirte a nuestras comunicaciones:
              </p>
              <ul className={`space-y-2 ${bodyText}`}>
                <ListItem>Nombre completo</ListItem>
                <ListItem>Correo electrónico</ListItem>
                <ListItem>Número de teléfono</ListItem>
                <ListItem>Dirección de envío</ListItem>
                <ListItem>
                  Datos de pago — procesados directamente por Stripe, nuestro
                  proveedor de pagos; FLOW nunca almacena números de tarjeta ni
                  datos bancarios
                </ListItem>
              </ul>
              <p className={`${bodyText} mt-4`}>
                No recabamos datos personales sensibles en los términos de la
                LFPDPPP.
              </p>
            </section>

            {/* 3. Finalidades */}
            <section aria-labelledby="finalidades">
              <SectionTitle id="finalidades">
                3. Finalidades del tratamiento
              </SectionTitle>
              <h3 className="text-sm md:text-base text-white font-medium mb-2">
                Finalidades primarias
              </h3>
              <p className={`${bodyText} mb-3`}>
                Necesarias para la relación jurídica entre tú y FLOW:
              </p>
              <ul className={`space-y-2 ${bodyText} mb-6`}>
                <ListItem>Procesar y confirmar tus pedidos</ListItem>
                <ListItem>Realizar el envío y la entrega de tus productos</ListItem>
                <ListItem>Emitir facturación y comprobantes de compra</ListItem>
                <ListItem>
                  Atender aclaraciones, devoluciones, cambios y garantías
                </ListItem>
              </ul>
              <h3 className="text-sm md:text-base text-white font-medium mb-2">
                Finalidades secundarias
              </h3>
              <p className={bodyText}>
                Enviarte por correo electrónico promociones, novedades y
                comunicaciones de marketing de FLOW. Si no deseas que tus
                datos se traten para esta finalidad, puedes darte de baja en
                cualquier momento mediante el enlace de cancelación incluido
                en cada correo, o escribiéndonos a{" "}
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-white underline underline-offset-4 hover:text-flow-200 transition-colors"
                >
                  {contactEmail}
                </a>
                . Negarte al tratamiento para finalidades secundarias no será
                motivo para negarte nuestros productos o servicios.
              </p>
            </section>

            {/* 4. Transferencias */}
            <section aria-labelledby="transferencias">
              <SectionTitle id="transferencias">
                4. Transferencias y encargados
              </SectionTitle>
              <p className={`${bodyText} mb-4`}>
                Para operar nuestra tienda compartimos datos personales con
                los siguientes proveedores, que actúan como encargados del
                tratamiento y únicamente en la medida necesaria para prestar
                sus servicios:
              </p>
              <ul className={`space-y-2 ${bodyText} mb-4`}>
                <ListItem>
                  <span className="text-white">Stripe</span> — procesamiento
                  de pagos
                </ListItem>
                <ListItem>
                  <span className="text-white">Supabase</span> — alojamiento
                  de la base de datos de la tienda
                </ListItem>
                <ListItem>
                  <span className="text-white">Resend</span> — envío de
                  correos transaccionales y de marketing
                </ListItem>
                <ListItem>
                  <span className="text-white">DHL</span> — servicios de
                  paquetería y entrega
                </ListItem>
                <ListItem>
                  <span className="text-white">Google Analytics y Meta</span>{" "}
                  — analítica y publicidad; solo se activan si otorgas tu
                  consentimiento en el aviso de cookies
                </ListItem>
              </ul>
              <p className={bodyText}>
                Fuera de estos casos, no transferimos tus datos personales a
                terceros sin tu consentimiento, salvo las excepciones
                previstas en el artículo 37 de la LFPDPPP.
              </p>
            </section>

            {/* 5. ARCO */}
            <section aria-labelledby="arco">
              <SectionTitle id="arco">
                5. Derechos ARCO y cómo ejercerlos
              </SectionTitle>
              <p className={`${bodyText} mb-4`}>
                Tienes derecho a conocer qué datos personales tenemos de ti y
                para qué los usamos (Acceso); a solicitar su corrección si
                están desactualizados o son inexactos (Rectificación); a que
                los eliminemos cuando consideres que no se usan conforme a
                este aviso (Cancelación); y a oponerte a su uso para fines
                específicos (Oposición).
              </p>
              <p className={`${bodyText} mb-4`}>
                Para ejercer cualquiera de estos derechos, o para revocar el
                consentimiento que nos hayas otorgado, envía una solicitud a{" "}
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-white underline underline-offset-4 hover:text-flow-200 transition-colors"
                >
                  {contactEmail}
                </a>{" "}
                indicando: (i) tu nombre completo y un medio para
                comunicarte la respuesta; (ii) los documentos que acrediten tu
                identidad; (iii) la descripción clara y precisa de los datos
                respecto de los que buscas ejercer tus derechos; y (iv)
                cualquier elemento que facilite la localización de tus datos.
                Responderemos en los plazos previstos por la LFPDPPP.
              </p>
              <p className={bodyText}>
                Si consideras que tu derecho a la protección de datos ha sido
                vulnerado, puedes acudir al Instituto Nacional de
                Transparencia, Acceso a la Información y Protección de Datos
                Personales (INAI) — www.inai.org.mx.
              </p>
            </section>

            {/* 6. Cookies */}
            <section aria-labelledby="cookies">
              <SectionTitle id="cookies">6. Uso de cookies</SectionTitle>
              <p className={bodyText}>
                Nuestro sitio utiliza cookies propias necesarias para su
                funcionamiento (por ejemplo, tu carrito y tus preferencias de
                idioma) y, únicamente con tu consentimiento, cookies de
                analítica y marketing de Google Analytics y Meta. Al ingresar
                al sitio, el aviso de cookies te permite aceptar o rechazar
                estas últimas, y puedes cambiar tu decisión en cualquier
                momento desde el propio aviso.
              </p>
            </section>

            {/* 7. Cambios */}
            <section aria-labelledby="cambios">
              <SectionTitle id="cambios">
                7. Cambios a este aviso
              </SectionTitle>
              <p className={bodyText}>
                Este Aviso de Privacidad puede sufrir modificaciones derivadas
                de nuevos requerimientos legales o de nuestras propias
                prácticas. Cualquier cambio se publicará en esta página
                (www.flowurbanwear.com/privacidad) junto con su fecha de
                última actualización.
              </p>
            </section>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}

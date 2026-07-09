import {
  Section,
  Text,
  Heading,
  Hr,
  Link,
  Row,
  Column,
} from "@react-email/components";
import * as t from "./theme";
import { EmailLayout, type EmailBrand } from "./EmailLayout";

interface OrderItem {
  productName: string;
  colorName?: string | null;
  size: string;
  quantity: number;
  price: number;
}

interface OrderShippedProps extends EmailBrand {
  orderId: string;
  customerName: string;
  items?: OrderItem[];
  trackingNumber?: string | null;
  carrier?: string | null;
}

/** DHL México tracking deep link (verified: returns the rastreo page pre-filled). */
function trackingUrl(carrier: string, trackingNumber: string): string | null {
  if (carrier.trim().toUpperCase() === "DHL") {
    return `https://www.dhl.com/mx-es/home/rastreo.html?tracking-id=${encodeURIComponent(trackingNumber)}`;
  }
  return null;
}

export function OrderShippedEmail({
  orderId,
  customerName,
  items = [],
  trackingNumber,
  carrier,
  // Brand base.
  accent = t.colors.accent,
  logoImage,
  backgroundImage,
  footerTagline,
}: OrderShippedProps) {
  const resolvedCarrier = carrier?.trim() || "DHL";
  const trackUrl = trackingNumber
    ? trackingUrl(resolvedCarrier, trackingNumber)
    : null;

  return (
    <EmailLayout
      preview="¡Tu pedido va en camino! — FLOW"
      lang="es"
      accent={accent}
      logoImage={logoImage}
      backgroundImage={backgroundImage}
      footerTagline={footerTagline}
    >
      {/* Status pill */}
      <Section style={statusSection}>
        <Text
          style={{
            ...t.accentPill,
            color: accent,
            backgroundColor: t.accentAlpha(accent, 0.1),
            border: `1px solid ${t.accentAlpha(accent, 0.3)}`,
          }}
        >
          ● Pedido enviado
        </Text>
      </Section>

      {/* Headline */}
      <Section style={content}>
        <Heading style={heading}>¡Tu pedido va en camino!</Heading>
        <Text style={bodyTextCentered}>
          Hola {customerName}, tu pedido ya salió de nuestro estudio y está en
          manos de {resolvedCarrier}. Pronto lo tendrás contigo.
        </Text>
      </Section>

      {/* Order ID block */}
      <Section style={orderIdBlock}>
        <Text style={orderIdLabel}>Número de pedido</Text>
        <Text style={orderIdValue}>#{orderId}</Text>
      </Section>

      {/* Tracking block */}
      {trackingNumber ? (
        <>
          <Hr style={t.divider} />
          <Section style={trackingBlock}>
            <Text style={orderIdLabel}>
              Guía de rastreo · {resolvedCarrier}
            </Text>
            <Text style={orderIdValue}>{trackingNumber}</Text>
            {trackUrl ? (
              <Section style={ctaSection}>
                <Link
                  href={trackUrl}
                  style={{ ...t.ctaButton, backgroundColor: accent }}
                >
                  Rastrear mi pedido
                </Link>
              </Section>
            ) : null}
          </Section>
        </>
      ) : null}

      {items.length > 0 ? (
        <>
          <Hr style={t.divider} />

          {/* Items summary */}
          <Section style={content}>
            <Text style={t.label}>En este envío</Text>
            {items.map((item, i) => (
              <Row key={i} style={itemRow}>
                <Column style={itemNameColumn}>
                  <Text style={itemName}>
                    {item.productName}
                    {item.colorName ? ` — ${item.colorName}` : ""}
                  </Text>
                  <Text style={itemMeta}>
                    Talla {item.size} &middot; Cant. {item.quantity}
                  </Text>
                </Column>
              </Row>
            ))}
          </Section>
        </>
      ) : null}

      <Hr style={t.divider} />

      {/* Delivery expectations */}
      <Section style={content}>
        <Text style={t.label}>Tiempo estimado de entrega</Text>
        <Text style={deliveryText}>Envío nacional: 5–7 días hábiles</Text>
        <Text style={deliveryText}>
          CDMX y área metropolitana: 4–6 días hábiles
        </Text>
        <Text style={deliveryNote}>
          Los tiempos pueden variar según la paquetería y tu zona de entrega.
        </Text>
      </Section>
    </EmailLayout>
  );
}

/* ─── Styles (content-only; frame lives in EmailLayout) ─── */

const statusSection = {
  textAlign: "center" as const,
  padding: "24px 0 8px 0",
};

const content = {
  padding: "8px 0",
};

const heading = {
  ...t.heading,
  textAlign: "center" as const,
};

const bodyTextCentered = {
  ...t.bodyText,
  textAlign: "center" as const,
};

const orderIdBlock = {
  textAlign: "center" as const,
  padding: "20px 0 8px 0",
};

const orderIdLabel = {
  fontSize: "10px",
  letterSpacing: "0.3em",
  textTransform: "uppercase" as const,
  color: t.colors.textFaint,
  margin: "0 0 4px 0",
};

const orderIdValue = {
  fontSize: "16px",
  color: t.colors.white,
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  letterSpacing: "0.05em",
  margin: "0",
};

const trackingBlock = {
  textAlign: "center" as const,
  padding: "8px 0",
};

const ctaSection = {
  textAlign: "center" as const,
  padding: "24px 0 8px 0",
};

const itemRow = {
  marginBottom: "14px",
};

const itemNameColumn = { width: "100%", verticalAlign: "top" as const };

const itemName = {
  fontSize: "14px",
  color: t.colors.white,
  fontWeight: "500" as const,
  margin: "0",
  lineHeight: "1.4",
};

const itemMeta = {
  fontSize: "12px",
  color: t.colors.textFaint,
  margin: "4px 0 0 0",
};

const deliveryText = {
  fontSize: "14px",
  color: t.colors.text,
  margin: "0 0 6px 0",
  lineHeight: "1.6",
};

const deliveryNote = {
  fontSize: "12px",
  color: t.colors.textFaint,
  margin: "10px 0 0 0",
  lineHeight: "1.6",
};

export default OrderShippedEmail;

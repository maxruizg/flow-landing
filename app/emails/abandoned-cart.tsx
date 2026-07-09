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

export interface AbandonedCartItem {
  productName: string;
  colorName?: string | null;
  size?: string | null;
  quantity: number;
  /** Unit price in the cart's currency. */
  price: number;
}

interface AbandonedCartEmailProps extends EmailBrand {
  customerName?: string | null;
  items: AbandonedCartItem[];
  total?: number | null;
  currency?: string | null;
}

/**
 * Spanish abandoned-cart reminder. The cart lives in the shopper's
 * localStorage ("flow-cart" — see app/context/CartContext.tsx), so returning
 * to /checkout in the same browser restores it exactly as they left it; the
 * copy leans on that.
 */
export function AbandonedCartEmail({
  customerName,
  items,
  total,
  currency,
  // Brand base.
  accent = t.colors.accent,
  logoImage,
  backgroundImage,
  footerTagline,
  unsubscribeUrl = `${t.brand.site}/unsubscribe`,
}: AbandonedCartEmailProps) {
  const currencySymbol =
    (currency || "usd").toLowerCase() === "mxn" ? "MX$" : "$";
  const currencyLabel = (currency || "usd").toUpperCase();
  const greetingName = customerName?.trim()
    ? `Hola ${customerName.trim().split(/\s+/)[0]}, `
    : "";
  const checkoutUrl = `${t.brand.site}/checkout`;

  return (
    <EmailLayout
      preview="Tus piezas siguen apartadas en tu carrito — completa tu compra"
      lang="es"
      accent={accent}
      logoImage={logoImage}
      backgroundImage={backgroundImage}
      footerTagline={footerTagline}
      unsubscribeUrl={unsubscribeUrl}
      marketing
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
          ● Tu carrito te espera
        </Text>
      </Section>

      {/* Headline */}
      <Section style={content}>
        <Heading style={headingCentered}>Dejaste algo en tu carrito</Heading>
        <Text style={bodyCentered}>
          {greetingName}guardamos tus piezas tal como las dejaste. Vuelve al
          checkout desde este mismo navegador y tu carrito aparecerá listo para
          completar la compra.
        </Text>
      </Section>

      <Hr style={t.divider} />

      {/* Cart summary */}
      <Section style={content}>
        <Text style={t.label}>Tu selección</Text>
        {items.map((item, i) => (
          <Row key={i} style={itemRow}>
            <Column style={itemNameColumn}>
              <Text style={itemName}>
                {item.productName}
                {item.colorName ? ` — ${item.colorName}` : ""}
              </Text>
              <Text style={itemMeta}>
                {item.size ? `Talla ${item.size} · ` : ""}Cant. {item.quantity}
              </Text>
            </Column>
            <Column style={itemPriceColumn}>
              <Text style={itemPrice}>
                {currencySymbol}
                {(item.price * item.quantity).toFixed(2)}
              </Text>
            </Column>
          </Row>
        ))}
      </Section>

      {typeof total === "number" && total > 0 ? (
        <>
          <Hr style={t.dividerSoft} />
          <Section style={content}>
            <Row>
              <Column style={itemNameColumn}>
                <Text style={totalLabel}>Total estimado</Text>
              </Column>
              <Column style={itemPriceColumn}>
                <Text style={totalAmount}>
                  {currencySymbol}
                  {total.toFixed(2)}{" "}
                  <span style={totalCurrency}>{currencyLabel}</span>
                </Text>
              </Column>
            </Row>
          </Section>
        </>
      ) : null}

      {/* CTA */}
      <Section style={ctaSection}>
        <Link
          href={checkoutUrl}
          style={{ ...t.ctaButton, backgroundColor: accent }}
        >
          Completar mi compra
        </Link>
        <Text style={ctaHint}>
          Los precios y el stock pueden cambiar — asegura tus piezas antes de
          que se agoten.
        </Text>
      </Section>
    </EmailLayout>
  );
}

/* ─── Styles (content-only; frame lives in EmailLayout) ─── */

const statusSection = {
  textAlign: "center" as const,
  padding: "8px 0 8px 0",
};

const content = {
  padding: "8px 0",
};

const headingCentered = {
  ...t.heading,
  textAlign: "center" as const,
};

const bodyCentered = {
  ...t.bodyText,
  textAlign: "center" as const,
};

const itemRow = {
  marginBottom: "14px",
};

const itemNameColumn = { width: "70%", verticalAlign: "top" as const };
const itemPriceColumn = {
  width: "30%",
  textAlign: "right" as const,
  verticalAlign: "top" as const,
};

const itemName = {
  fontFamily: t.fonts.body,
  fontSize: "14px",
  color: t.colors.white,
  fontWeight: "500" as const,
  margin: "0",
  lineHeight: "1.4",
};

const itemMeta = {
  fontFamily: t.fonts.body,
  fontSize: "12px",
  color: t.colors.textFaint,
  margin: "4px 0 0 0",
};

const itemPrice = {
  fontFamily: t.fonts.body,
  fontSize: "14px",
  color: "#e5e5e5",
  fontWeight: "500" as const,
  margin: "0",
  fontVariantNumeric: "tabular-nums" as const,
};

const totalLabel = {
  fontFamily: t.fonts.body,
  fontSize: "15px",
  fontWeight: "600" as const,
  color: t.colors.white,
  margin: "0",
  letterSpacing: "0.02em",
};

const totalAmount = {
  fontFamily: t.fonts.body,
  fontSize: "20px",
  fontWeight: "700" as const,
  color: t.colors.white,
  margin: "0",
  fontVariantNumeric: "tabular-nums" as const,
};

const totalCurrency = {
  fontSize: "11px",
  color: t.colors.textFaint,
  fontWeight: "500" as const,
  letterSpacing: "0.15em",
};

const ctaSection = {
  textAlign: "center" as const,
  padding: "28px 0 16px 0",
};

const ctaHint = {
  fontFamily: t.fonts.body,
  fontSize: "12px",
  color: t.colors.textFaint,
  margin: "14px 0 0 0",
  lineHeight: "1.6",
};

export default AbandonedCartEmail;

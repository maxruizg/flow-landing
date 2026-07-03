import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Link,
  Preview,
  Row,
  Column,
} from "@react-email/components";
import * as t from "./theme";

export interface AbandonedCartItem {
  productName: string;
  colorName?: string | null;
  size?: string | null;
  quantity: number;
  /** Unit price in the cart's currency. */
  price: number;
}

interface AbandonedCartEmailProps {
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
}: AbandonedCartEmailProps) {
  const currencySymbol = (currency || "usd").toLowerCase() === "mxn" ? "MX$" : "$";
  const currencyLabel = (currency || "usd").toUpperCase();
  const greetingName = customerName?.trim() ? `Hola ${customerName.trim().split(/\s+/)[0]}, ` : "";
  const checkoutUrl = `${t.brand.site}/checkout`;

  return (
    <Html lang="es">
      <Head>
        {/* Static brand font import shared by every template (see theme.ts). */}
        <style dangerouslySetInnerHTML={{ __html: t.fontImportCss }} />
      </Head>
      <Preview>Tus piezas siguen apartadas en tu carrito — completa tu compra</Preview>
      <Body style={t.main}>
        <Container style={t.container}>
          {/* Brand header */}
          <Section style={t.header}>
            <Text style={t.logo}>FLOW</Text>
            <Text style={t.tagline}>URBAN WEAR</Text>
          </Section>

          {/* Status pill */}
          <Section style={statusSection}>
            <Text style={t.accentPill}>● Tu carrito te espera</Text>
          </Section>

          {/* Headline */}
          <Section style={content}>
            <Heading style={headingCentered}>Dejaste algo en tu carrito</Heading>
            <Text style={bodyCentered}>
              {greetingName}guardamos tus piezas tal como las dejaste. Vuelve al
              checkout desde este mismo navegador y tu carrito aparecerá listo
              para completar la compra.
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
            <Link href={checkoutUrl} style={t.ctaButton}>
              Completar mi compra
            </Link>
            <Text style={ctaHint}>
              Los precios y el stock pueden cambiar — asegura tus piezas antes
              de que se agoten.
            </Text>
          </Section>

          <Hr style={t.divider} />

          {/* Footer */}
          <Section style={t.footer}>
            <Text style={t.socialLinks}>
              <Link href={t.brand.instagram} style={t.socialLink}>
                Instagram
              </Link>
              {"   ·   "}
              <Link href={t.brand.tiktok} style={t.socialLink}>
                TikTok
              </Link>
            </Text>
            <Text style={t.footerText}>
              Flow Urban Wear — Community-based streetwear from Mexico City.
            </Text>
            <Text style={t.footerSmall}>
              ¿Dudas? Escríbenos a{" "}
              <Link href={`mailto:${t.brand.email}`} style={t.footerLink}>
                {t.brand.email}
              </Link>
            </Text>
            <Text style={unsubscribeText}>
              Recibiste este correo porque iniciaste una compra en{" "}
              {t.brand.site.replace("https://", "")}.{" "}
              <Link href={`${t.brand.site}/unsubscribe`} style={unsubscribeLink}>
                Darme de baja
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

/* ─── Styles (local tweaks over the shared theme) ─── */

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

const unsubscribeText = {
  fontFamily: t.fonts.body,
  fontSize: "11px",
  color: t.colors.textGhost,
  margin: "16px 0 0 0",
  lineHeight: "1.6",
};

const unsubscribeLink = {
  color: t.colors.textMuted,
  textDecoration: "underline",
  textUnderlineOffset: "2px",
};

export default AbandonedCartEmail;

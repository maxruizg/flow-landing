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

interface OrderConfirmationProps extends EmailBrand {
  orderId: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  currency: string;
  subject?: string;
  headerText?: string;
  bodyText?: string;
  heroImage?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export function OrderConfirmationEmail({
  orderId,
  customerName,
  items,
  total,
  currency,
  subject = "Order Confirmed — FLOW",
  headerText = "Your order is confirmed",
  bodyText = "We're preparing your pieces and will send a tracking link the moment they ship.",
  heroImage,
  ctaText = "View Showroom",
  ctaUrl = `${t.brand.site}/showroom`,
  // Brand base (falls back to theme tokens inside EmailLayout).
  accent = t.colors.accent,
  logoImage,
  backgroundImage,
  footerTagline,
}: OrderConfirmationProps) {
  const currencySymbol = currency.toLowerCase() === "mxn" ? "MX$" : "$";
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = Math.max(0, total - subtotal);

  return (
    <EmailLayout
      preview={subject}
      accent={accent}
      logoImage={logoImage}
      backgroundImage={backgroundImage}
      footerTagline={footerTagline}
      heroImage={heroImage}
    >
      {/* Status pill */}
      <Section style={statusSection}>
        <Text
          style={{
            ...statusPill,
            color: accent,
            backgroundColor: t.accentAlpha(accent, 0.1),
            border: `1px solid ${t.accentAlpha(accent, 0.3)}`,
          }}
        >
          ● Payment confirmed
        </Text>
      </Section>

      {/* Headline */}
      <Section style={content}>
        <Heading style={heading}>{headerText}</Heading>
        <Text style={bodyTextStyle}>
          Hi {customerName}, {bodyText}
        </Text>
      </Section>

      {/* Order ID block */}
      <Section style={orderIdBlock}>
        <Text style={orderIdLabel}>Order Number</Text>
        <Text style={orderIdValue}>#{orderId}</Text>
      </Section>

      <Hr style={t.divider} />

      {/* Order summary */}
      <Section style={content}>
        <Text style={sectionTitle}>Order Summary</Text>
        {items.map((item, i) => (
          <Row key={i} style={itemRow}>
            <Column style={itemNameColumn}>
              <Text style={itemName}>
                {item.productName}
                {item.colorName ? ` — ${item.colorName}` : ""}
              </Text>
              <Text style={itemMeta}>
                Size {item.size} &middot; Qty {item.quantity}
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

      <Hr style={t.dividerSoft} />

      {/* Subtotal + shipping breakdown */}
      <Section style={content}>
        <Row style={breakdownRow}>
          <Column style={itemNameColumn}>
            <Text style={breakdownLabel}>Subtotal</Text>
          </Column>
          <Column style={itemPriceColumn}>
            <Text style={breakdownValue}>
              {currencySymbol}
              {subtotal.toFixed(2)}
            </Text>
          </Column>
        </Row>
        <Row style={breakdownRow}>
          <Column style={itemNameColumn}>
            <Text style={breakdownLabel}>Shipping</Text>
          </Column>
          <Column style={itemPriceColumn}>
            <Text style={breakdownValue}>
              {shipping > 0
                ? `${currencySymbol}${shipping.toFixed(2)}`
                : "Free"}
            </Text>
          </Column>
        </Row>
      </Section>

      <Hr style={t.divider} />

      {/* Total */}
      <Section style={totalSection}>
        <Row>
          <Column style={itemNameColumn}>
            <Text style={totalLabel}>Total</Text>
          </Column>
          <Column style={itemPriceColumn}>
            <Text style={totalAmount}>
              {currencySymbol}
              {total.toFixed(2)}{" "}
              <span style={totalCurrency}>{currency.toUpperCase()}</span>
            </Text>
          </Column>
        </Row>
      </Section>

      {/* CTA */}
      {ctaText && ctaUrl ? (
        <Section style={ctaSection}>
          <Link
            href={ctaUrl}
            style={{ ...t.ctaButton, backgroundColor: accent }}
          >
            {ctaText}
          </Link>
        </Section>
      ) : null}

      {/* Status / next steps */}
      <Section style={stepsSection}>
        <Text style={stepsHeader}>What's next</Text>
        <Row>
          <Column style={stepCol}>
            <Text
              style={{
                ...stepBadge,
                border: `1px solid ${t.accentAlpha(accent, 0.3)}`,
                backgroundColor: t.accentAlpha(accent, 0.1),
                color: accent,
              }}
            >
              1
            </Text>
            <Text style={{ ...stepLabel, color: accent }}>Confirmed</Text>
          </Column>
          <Column style={stepCol}>
            <Text style={stepBadge}>2</Text>
            <Text style={stepLabel}>Preparing</Text>
          </Column>
          <Column style={stepCol}>
            <Text style={stepBadge}>3</Text>
            <Text style={stepLabel}>Shipped</Text>
          </Column>
        </Row>
      </Section>
    </EmailLayout>
  );
}

/* ─── Styles (content-only; frame lives in EmailLayout) ─── */

const statusSection = {
  textAlign: "center" as const,
  padding: "24px 0 8px 0",
};

const statusPill = {
  display: "inline-block",
  fontSize: "10px",
  fontWeight: "600" as const,
  letterSpacing: "0.3em",
  textTransform: "uppercase" as const,
  borderRadius: "9999px",
  padding: "6px 14px",
  margin: "0",
};

const content = {
  padding: "8px 0",
};

const heading = {
  ...t.heading,
  textAlign: "center" as const,
};

const bodyTextStyle = {
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

const sectionTitle = {
  fontSize: "10px",
  fontWeight: "700" as const,
  letterSpacing: "0.3em",
  textTransform: "uppercase" as const,
  color: t.colors.textFaint,
  margin: "0 0 16px 0",
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

const itemPrice = {
  fontSize: "14px",
  color: "#e5e5e5",
  fontWeight: "500" as const,
  margin: "0",
  fontVariantNumeric: "tabular-nums" as const,
};

const breakdownRow = { marginBottom: "6px" };

const breakdownLabel = {
  fontSize: "13px",
  color: t.colors.textFaint,
  margin: "0",
};

const breakdownValue = {
  fontSize: "13px",
  color: "#d4d4d4",
  margin: "0",
  fontVariantNumeric: "tabular-nums" as const,
};

const totalSection = { padding: "4px 0" };

const totalLabel = {
  fontSize: "15px",
  fontWeight: "600" as const,
  color: t.colors.white,
  margin: "0",
  letterSpacing: "0.02em",
};

const totalAmount = {
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

const stepsSection = {
  padding: "16px 0 8px 0",
  textAlign: "center" as const,
};

const stepsHeader = {
  fontSize: "10px",
  letterSpacing: "0.3em",
  textTransform: "uppercase" as const,
  color: t.colors.textFaint,
  margin: "0 0 16px 0",
};

const stepCol = {
  width: "33.33%",
  textAlign: "center" as const,
};

const stepBadge = {
  display: "inline-block",
  width: "32px",
  height: "32px",
  lineHeight: "30px",
  borderRadius: "9999px",
  border: `1px solid ${t.colors.border}`,
  backgroundColor: "#0f0f0f",
  color: t.colors.textGhost,
  fontSize: "13px",
  fontWeight: "600" as const,
  margin: "0 auto 8px auto",
};

const stepLabel = {
  fontSize: "10px",
  letterSpacing: "0.2em",
  textTransform: "uppercase" as const,
  color: t.colors.textGhost,
  margin: "0",
};

export default OrderConfirmationEmail;

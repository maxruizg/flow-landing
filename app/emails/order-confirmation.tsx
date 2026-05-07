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
  Img,
  Preview,
  Row,
  Column,
} from "@react-email/components";

interface OrderItem {
  productName: string;
  colorName?: string | null;
  size: string;
  quantity: number;
  price: number;
}

interface OrderConfirmationProps {
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
  ctaUrl = "https://flowurbanwear.com/showroom",
}: OrderConfirmationProps) {
  const currencySymbol = currency.toLowerCase() === "mxn" ? "MX$" : "$";
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = Math.max(0, total - subtotal);

  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Brand header */}
          <Section style={header}>
            <Text style={logo}>FLOW</Text>
            <Text style={tagline}>URBAN WEAR</Text>
          </Section>

          {/* Hero image — uploaded by admin, sits hero-style at the top */}
          {heroImage ? (
            <Section style={heroSection}>
              <Img
                src={heroImage}
                alt="Flow Urban Wear"
                width="560"
                style={heroImageStyle}
              />
            </Section>
          ) : null}

          {/* Status pill */}
          <Section style={statusSection}>
            <Text style={statusPill}>● Payment confirmed</Text>
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

          <Hr style={divider} />

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

          <Hr style={dividerSoft} />

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

          <Hr style={divider} />

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
              <Link href={ctaUrl} style={ctaButton}>
                {ctaText}
              </Link>
            </Section>
          ) : null}

          {/* Status / next steps */}
          <Section style={stepsSection}>
            <Text style={stepsHeader}>What's next</Text>
            <Row>
              <Column style={stepCol}>
                <Text style={stepBadgeActive}>1</Text>
                <Text style={stepLabelActive}>Confirmed</Text>
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

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={socialLinks}>
              <Link href="https://instagram.com/flowurbanwear" style={socialLink}>
                Instagram
              </Link>
              {"   ·   "}
              <Link href="https://tiktok.com/@flowurbanwear" style={socialLink}>
                TikTok
              </Link>
            </Text>
            <Text style={footerText}>
              Flow Urban Wear — Community-based streetwear from Mexico City.
            </Text>
            <Text style={footerSmall}>
              Questions about your order? Reply to this email or write us at{" "}
              <Link href="mailto:contact@flowurbanwear.com" style={footerLink}>
                contact@flowurbanwear.com
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

/* ─── Styles ─── */

const fontFamily =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const main = {
  backgroundColor: "#0a0a0a",
  fontFamily,
  margin: 0,
  padding: 0,
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px",
};

const header = {
  textAlign: "center" as const,
  padding: "8px 0 28px 0",
};

const logo = {
  fontSize: "32px",
  fontWeight: "800" as const,
  letterSpacing: "0.32em",
  color: "#ffffff",
  margin: "0",
  lineHeight: "1",
};

const tagline = {
  fontSize: "10px",
  letterSpacing: "0.42em",
  color: "#737373",
  margin: "6px 0 0 0",
  textTransform: "uppercase" as const,
};

const heroSection = {
  padding: "0 0 8px 0",
};

const heroImageStyle = {
  width: "100%",
  height: "auto",
  display: "block" as const,
  borderRadius: "16px",
  border: "1px solid #1f1f1f",
};

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
  color: "#34d399",
  backgroundColor: "rgba(52, 211, 153, 0.08)",
  border: "1px solid rgba(52, 211, 153, 0.25)",
  borderRadius: "9999px",
  padding: "6px 14px",
  margin: "0",
};

const content = {
  padding: "8px 0",
};

const heading = {
  fontSize: "26px",
  fontWeight: "700" as const,
  color: "#ffffff",
  lineHeight: "1.25",
  letterSpacing: "-0.01em",
  margin: "12px 0 12px 0",
  textAlign: "center" as const,
};

const bodyTextStyle = {
  fontSize: "15px",
  lineHeight: "1.7",
  color: "#a3a3a3",
  margin: "0",
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
  color: "#737373",
  margin: "0 0 4px 0",
};

const orderIdValue = {
  fontSize: "16px",
  color: "#ffffff",
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  letterSpacing: "0.05em",
  margin: "0",
};

const divider = { borderColor: "#262626", margin: "24px 0" };
const dividerSoft = { borderColor: "#1a1a1a", margin: "16px 0" };

const sectionTitle = {
  fontSize: "10px",
  fontWeight: "700" as const,
  letterSpacing: "0.3em",
  textTransform: "uppercase" as const,
  color: "#737373",
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
  color: "#ffffff",
  fontWeight: "500" as const,
  margin: "0",
  lineHeight: "1.4",
};

const itemMeta = {
  fontSize: "12px",
  color: "#737373",
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
  color: "#737373",
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
  color: "#ffffff",
  margin: "0",
  letterSpacing: "0.02em",
};

const totalAmount = {
  fontSize: "20px",
  fontWeight: "700" as const,
  color: "#ffffff",
  margin: "0",
  fontVariantNumeric: "tabular-nums" as const,
};

const totalCurrency = {
  fontSize: "11px",
  color: "#737373",
  fontWeight: "500" as const,
  letterSpacing: "0.15em",
};

const ctaSection = {
  textAlign: "center" as const,
  padding: "28px 0 16px 0",
};

const ctaButton = {
  backgroundColor: "#ffffff",
  color: "#0a0a0a",
  fontSize: "12px",
  fontWeight: "700" as const,
  letterSpacing: "0.2em",
  textTransform: "uppercase" as const,
  textDecoration: "none",
  padding: "16px 36px",
  borderRadius: "9999px",
  display: "inline-block",
};

const stepsSection = {
  padding: "16px 0 8px 0",
  textAlign: "center" as const,
};

const stepsHeader = {
  fontSize: "10px",
  letterSpacing: "0.3em",
  textTransform: "uppercase" as const,
  color: "#737373",
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
  border: "1px solid #262626",
  backgroundColor: "#0f0f0f",
  color: "#525252",
  fontSize: "13px",
  fontWeight: "600" as const,
  margin: "0 auto 8px auto",
};

const stepBadgeActive = {
  ...stepBadge,
  border: "1px solid rgba(52, 211, 153, 0.4)",
  backgroundColor: "rgba(52, 211, 153, 0.12)",
  color: "#34d399",
};

const stepLabel = {
  fontSize: "10px",
  letterSpacing: "0.2em",
  textTransform: "uppercase" as const,
  color: "#525252",
  margin: "0",
};

const stepLabelActive = { ...stepLabel, color: "#34d399" };

const footer = {
  textAlign: "center" as const,
  padding: "16px 0 0 0",
};

const socialLinks = {
  fontSize: "13px",
  color: "#525252",
  margin: "0 0 16px 0",
};

const socialLink = {
  color: "#a3a3a3",
  textDecoration: "none",
};

const footerText = {
  fontSize: "12px",
  color: "#737373",
  margin: "0 0 10px 0",
};

const footerSmall = {
  fontSize: "11px",
  color: "#525252",
  margin: "0",
  lineHeight: "1.6",
};

const footerLink = {
  color: "#a3a3a3",
  textDecoration: "underline",
  textUnderlineOffset: "2px",
};

export default OrderConfirmationEmail;

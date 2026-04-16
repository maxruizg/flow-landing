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
  headerText = "Thank you for your order",
  bodyText = "We are processing your order and will notify you when it ships.",
  heroImage,
  ctaText = "View Showroom",
  ctaUrl = "https://flowurbanwear.com/showroom",
}: OrderConfirmationProps) {
  const currencySymbol = currency === "mxn" ? "MX$" : "$";

  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>FLOW</Text>
            <Text style={tagline}>URBAN WEAR</Text>
          </Section>

          <Hr style={divider} />

          {heroImage && (
            <Section>
              <Img src={heroImage} alt="FLOW" width="100%" style={{ borderRadius: "12px", marginBottom: "24px" }} />
            </Section>
          )}

          <Section style={content}>
            <Heading style={heading}>{headerText}</Heading>
            <Text style={bodyTextStyle}>
              Hi {customerName}, {bodyText}
            </Text>
            <Text style={orderIdStyle}>Order #{orderId}</Text>
          </Section>

          <Hr style={divider} />

          <Section style={content}>
            <Text style={sectionTitle}>Order Summary</Text>
            {items.map((item, i) => (
              <Row key={i} style={itemRow}>
                <Column style={{ width: "70%" }}>
                  <Text style={itemName}>
                    {item.productName}
                    {item.colorName ? ` — ${item.colorName}` : ""}
                  </Text>
                  <Text style={itemMeta}>Size: {item.size} &middot; Qty: {item.quantity}</Text>
                </Column>
                <Column style={{ width: "30%", textAlign: "right" as const }}>
                  <Text style={itemPrice}>
                    {currencySymbol}{(item.price * item.quantity).toFixed(2)}
                  </Text>
                </Column>
              </Row>
            ))}
          </Section>

          <Hr style={divider} />

          <Section style={totalSection}>
            <Row>
              <Column style={{ width: "70%" }}>
                <Text style={totalLabel}>Total</Text>
              </Column>
              <Column style={{ width: "30%", textAlign: "right" as const }}>
                <Text style={totalAmount}>
                  {currencySymbol}{total.toFixed(2)} {currency.toUpperCase()}
                </Text>
              </Column>
            </Row>
          </Section>

          {ctaText && ctaUrl && (
            <Section style={ctaSection}>
              <Link href={ctaUrl} style={ctaButton}>
                {ctaText}
              </Link>
            </Section>
          )}

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              Flow Urban Wear — Community based streetwear from Mexico City.
            </Text>
            <Text style={footerSmall}>
              Questions about your order? Reply to this email or contact us at contact@flowurbanwear.com
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#0a0a0a",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
};
const container = { margin: "0 auto", padding: "40px 20px", maxWidth: "560px" };
const header = { textAlign: "center" as const, padding: "20px 0" };
const logo = { fontSize: "28px", fontWeight: "700" as const, letterSpacing: "0.3em", color: "#ffffff", margin: "0" };
const tagline = { fontSize: "10px", letterSpacing: "0.4em", color: "#737373", margin: "4px 0 0 0" };
const divider = { borderColor: "#262626", margin: "24px 0" };
const content = { padding: "8px 0" };
const heading = { fontSize: "22px", fontWeight: "600" as const, color: "#ffffff", lineHeight: "1.4", margin: "0 0 12px 0" };
const bodyTextStyle = { fontSize: "15px", lineHeight: "1.7", color: "#a3a3a3", margin: "0 0 16px 0" };
const orderIdStyle = { fontSize: "13px", color: "#737373", margin: "0", letterSpacing: "0.05em" };
const sectionTitle = { fontSize: "11px", fontWeight: "600" as const, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "#737373", margin: "0 0 16px 0" };
const itemRow = { marginBottom: "12px" };
const itemName = { fontSize: "14px", color: "#ffffff", fontWeight: "500" as const, margin: "0" };
const itemMeta = { fontSize: "12px", color: "#737373", margin: "4px 0 0 0" };
const itemPrice = { fontSize: "14px", color: "#d4d4d4", fontWeight: "500" as const, margin: "0" };
const totalSection = { padding: "8px 0" };
const totalLabel = { fontSize: "14px", fontWeight: "600" as const, color: "#ffffff", margin: "0" };
const totalAmount = { fontSize: "18px", fontWeight: "700" as const, color: "#ffffff", margin: "0" };
const ctaSection = { textAlign: "center" as const, padding: "24px 0" };
const ctaButton = { backgroundColor: "#ffffff", color: "#0a0a0a", fontSize: "12px", fontWeight: "600" as const, letterSpacing: "0.15em", textTransform: "uppercase" as const, textDecoration: "none", padding: "14px 32px", borderRadius: "9999px", display: "inline-block" };
const footer = { textAlign: "center" as const, padding: "8px 0" };
const footerText = { fontSize: "13px", color: "#737373", margin: "0 0 8px 0" };
const footerSmall = { fontSize: "11px", color: "#525252", margin: "0" };

export default OrderConfirmationEmail;

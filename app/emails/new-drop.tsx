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
} from "@react-email/components";

interface NewDropEmailProps {
  subject: string;
  body: string;
  siteUrl?: string;
}

export function NewDropEmail({
  subject,
  body,
  siteUrl = "https://flowurbanwear.com",
}: NewDropEmailProps) {
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

          <Section style={content}>
            <Heading style={heading}>{subject}</Heading>
            <Text style={bodyText}>{body}</Text>
          </Section>

          <Section style={ctaSection}>
            <Link href={`${siteUrl}/showroom`} style={ctaButton}>
              Shop Now
            </Link>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              Flow Urban Wear — Community based streetwear from Mexico City.
            </Text>
            <Text style={footerSmall}>
              You received this because you subscribed to Flow updates.
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

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
};

const header = {
  textAlign: "center" as const,
  padding: "20px 0",
};

const logo = {
  fontSize: "28px",
  fontWeight: "700" as const,
  letterSpacing: "0.3em",
  color: "#ffffff",
  margin: "0",
};

const tagline = {
  fontSize: "10px",
  letterSpacing: "0.4em",
  color: "#737373",
  margin: "4px 0 0 0",
};

const divider = {
  borderColor: "#262626",
  margin: "24px 0",
};

const content = {
  padding: "16px 0",
};

const heading = {
  fontSize: "22px",
  fontWeight: "600" as const,
  color: "#ffffff",
  lineHeight: "1.4",
  margin: "0 0 16px 0",
};

const bodyText = {
  fontSize: "15px",
  lineHeight: "1.7",
  color: "#a3a3a3",
  margin: "0",
  whiteSpace: "pre-line" as const,
};

const ctaSection = {
  textAlign: "center" as const,
  padding: "24px 0",
};

const ctaButton = {
  backgroundColor: "#ffffff",
  color: "#0a0a0a",
  fontSize: "12px",
  fontWeight: "600" as const,
  letterSpacing: "0.15em",
  textTransform: "uppercase" as const,
  textDecoration: "none",
  padding: "14px 32px",
  borderRadius: "9999px",
  display: "inline-block",
};

const footer = {
  textAlign: "center" as const,
  padding: "8px 0",
};

const footerText = {
  fontSize: "13px",
  color: "#737373",
  margin: "0 0 8px 0",
};

const footerSmall = {
  fontSize: "11px",
  color: "#525252",
  margin: "0",
};

export default NewDropEmail;

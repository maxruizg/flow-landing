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
} from "@react-email/components";
import * as t from "./theme";

interface NewDropEmailProps {
  subject: string;
  body: string;
  heroImage?: string;
  ctaText?: string;
  ctaUrl?: string;
  siteUrl?: string;
}

export function NewDropEmail({
  subject,
  body,
  heroImage,
  ctaText = "Shop Now",
  ctaUrl,
  siteUrl = t.brand.site,
}: NewDropEmailProps) {
  const finalCtaUrl = ctaUrl || `${siteUrl}/showroom`;

  return (
    <Html>
      <Head>
        <style dangerouslySetInnerHTML={{ __html: t.fontImportCss }} />
      </Head>
      <Preview>{subject}</Preview>
      <Body style={t.main}>
        <Container style={t.container}>
          <Section style={t.header}>
            <Text style={t.logo}>{t.brand.name}</Text>
            <Text style={t.tagline}>{t.brand.tagline}</Text>
          </Section>

          <Hr style={t.divider} />

          {heroImage && (
            <Section>
              <Img
                src={t.emailImageUrl(heroImage, 1200)}
                alt=""
                width="100%"
                style={heroImageStyle}
              />
            </Section>
          )}

          <Section style={content}>
            <Heading style={t.heading}>{subject}</Heading>
            <Text style={bodyText}>{body}</Text>
          </Section>

          <Section style={ctaSection}>
            <Link href={finalCtaUrl} style={t.ctaButton}>
              {ctaText}
            </Link>
          </Section>

          <Hr style={t.divider} />

          <Section style={t.footer}>
            <Text style={t.footerText}>
              Flow Urban Wear — Community based streetwear from Mexico City.
            </Text>
            <Text style={t.footerSmall}>
              You received this because you subscribed to Flow updates.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const heroImageStyle = {
  borderRadius: "12px",
  marginBottom: "24px",
  border: `1px solid ${t.colors.border}`,
};

const content = {
  padding: "16px 0",
};

const bodyText = {
  ...t.bodyText,
  whiteSpace: "pre-line" as const,
};

const ctaSection = {
  textAlign: "center" as const,
  padding: "24px 0",
};

export default NewDropEmail;

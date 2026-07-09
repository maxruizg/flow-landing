import { Section, Text, Heading, Link } from "@react-email/components";
import * as t from "./theme";
import { EmailLayout, type EmailBrand } from "./EmailLayout";

interface NewDropEmailProps extends EmailBrand {
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
  // Brand base.
  accent = t.colors.accent,
  logoImage,
  backgroundImage,
  footerTagline,
  unsubscribeUrl,
}: NewDropEmailProps) {
  const finalCtaUrl = ctaUrl || `${siteUrl}/showroom`;

  return (
    <EmailLayout
      preview={subject}
      accent={accent}
      logoImage={logoImage}
      backgroundImage={backgroundImage}
      footerTagline={footerTagline}
      heroImage={heroImage}
      unsubscribeUrl={unsubscribeUrl}
      marketing
    >
      <Section style={content}>
        <Heading style={t.heading}>{subject}</Heading>
        <Text style={bodyText}>{body}</Text>
      </Section>

      <Section style={ctaSection}>
        <Link
          href={finalCtaUrl}
          style={{ ...t.ctaButton, backgroundColor: accent }}
        >
          {ctaText}
        </Link>
      </Section>
    </EmailLayout>
  );
}

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

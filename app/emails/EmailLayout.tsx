import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Link,
  Img,
  Preview,
} from "@react-email/components";
import type { ReactNode } from "react";
import * as t from "./theme";

/**
 * Shared brand frame for EVERY FLOW email.
 *
 * Guarantees an identical header (logo) and footer across all templates —
 * transactional (order confirmation, shipped, abandoned cart) and marketing
 * (campaigns, new drop) alike — so the brand reads the same everywhere. Each
 * template only provides its unique content as `children`.
 *
 * Brand values (`accent`, `logoImage`, `footerTagline`, ...) come from the
 * admin-editable email brand base (email_settings key "email_brand") threaded
 * in by the send paths, falling back to the static tokens in ./theme when a
 * value isn't set — so nothing breaks if the admin hasn't configured anything.
 */
export interface EmailBrand {
  /** Brand accent hex (e.g. "#b8a490"). Falls back to theme accent. */
  accent?: string;
  /** Logo image URL (Supabase). If absent, renders the FLOW text logo. */
  logoImage?: string;
  /** Full-bleed background photo for the top brand band (site-hero style).
   *  Works in Gmail/Apple Mail; Outlook desktop falls back to the dark color. */
  backgroundImage?: string;
  /** Default hero image applied when a template/campaign doesn't set its own. */
  defaultHeroImage?: string;
  /** Footer brand line. */
  footerTagline?: string;
  /** Unsubscribe URL. */
  unsubscribeUrl?: string;
}

interface EmailLayoutProps extends EmailBrand {
  /** Inbox preview text. */
  preview: string;
  /** Optional top hero image for this specific email. */
  heroImage?: string;
  heroAlt?: string;
  /** Marketing emails pass true to render the unsubscribe line. */
  marketing?: boolean;
  /** Document language (e.g. "es" for Spanish templates). */
  lang?: string;
  children: ReactNode;
}

const DEFAULT_FOOTER_TAGLINE =
  "Flow Urban Wear — Community-based streetwear from Mexico City.";

/** Responsive rules (Gmail/Apple Mail honour <style> in <head>). On phones the
 *  hero band grows and the product photo shrinks, per the desired look. */
const responsiveCss = `
@media only screen and (max-width:620px){
  .flow-container{padding:24px 14px !important}
  .flow-hero-band{padding:104px 16px !important}
  .flow-hero-img{max-width:210px !important}
}`;

export function EmailLayout({
  preview,
  accent = t.colors.accent,
  logoImage,
  backgroundImage,
  footerTagline = DEFAULT_FOOTER_TAGLINE,
  unsubscribeUrl,
  heroImage,
  heroAlt = "Flow Urban Wear",
  marketing = false,
  lang,
  children,
}: EmailLayoutProps) {
  return (
    <Html lang={lang}>
      <Head>
        <style>{t.fontImportCss + responsiveCss}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body style={t.main}>
        <Container style={t.container} className="flow-container">
          {/* Brand header — a full-bleed photo band (site-hero style) when a
              backgroundImage is set, otherwise the plain centered wordmark. */}
          {backgroundImage ? (
            <Section
              className="flow-hero-band"
              style={{
                ...heroBand,
                backgroundImage: `linear-gradient(rgba(10,10,10,0.55), rgba(10,10,10,0.78)), url(${t.emailImageUrl(
                  backgroundImage,
                  1200,
                )})`,
              }}
            >
              {logoImage ? (
                <Img
                  src={t.emailImageUrl(logoImage, 400)}
                  alt={t.brand.name}
                  height="40"
                  style={logoImageStyle}
                />
              ) : (
                <>
                  <Text style={heroLogo}>{t.brand.name}</Text>
                  <Text style={{ ...t.tagline, color: accent, margin: "8px 0 0 0" }}>
                    {t.brand.tagline}
                  </Text>
                </>
              )}
            </Section>
          ) : (
            <Section style={t.header}>
              {logoImage ? (
                <Img
                  src={t.emailImageUrl(logoImage, 400)}
                  alt={t.brand.name}
                  height="40"
                  style={logoImageStyle}
                />
              ) : (
                <>
                  <Text style={t.logo}>{t.brand.name}</Text>
                  <Text style={{ ...t.tagline, color: accent }}>
                    {t.brand.tagline}
                  </Text>
                </>
              )}
            </Section>
          )}

          {/* Optional top hero (product photo) — smaller + centered */}
          {heroImage ? (
            <Section style={heroSection}>
              <Img
                src={t.emailImageUrl(heroImage, 800)}
                alt={heroAlt}
                width="340"
                className="flow-hero-img"
                style={heroImageStyle}
              />
            </Section>
          ) : null}

          {/* Unique per-template content */}
          {children}

          <Hr style={t.divider} />

          {/* Brand footer — identical everywhere */}
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
            <Text style={t.footerText}>{footerTagline}</Text>
            <Text style={t.footerSmall}>
              Questions? Write us at{" "}
              <Link href={`mailto:${t.brand.email}`} style={t.footerLink}>
                {t.brand.email}
              </Link>
            </Text>
            {marketing && unsubscribeUrl ? (
              <Text style={t.footerSmall}>
                <Link href={unsubscribeUrl} style={t.footerLink}>
                  Unsubscribe
                </Link>
              </Text>
            ) : null}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const logoImageStyle = {
  height: "40px",
  width: "auto",
  display: "block" as const,
  margin: "0 auto",
};

/** Full-bleed photo band behind the logo. `backgroundImage` (gradient + photo)
 *  is applied at the call site; `backgroundColor` is the Outlook fallback. */
const heroBand = {
  backgroundColor: t.colors.black,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  textAlign: "center" as const,
  padding: "80px 24px",
  borderRadius: "16px",
  marginBottom: "8px",
};

const heroLogo = {
  ...t.logo,
  fontSize: "34px",
};

const heroSection = {
  padding: "0 0 8px 0",
  textAlign: "center" as const,
};

const heroImageStyle = {
  width: "100%",
  maxWidth: "340px",
  height: "auto",
  display: "block" as const,
  margin: "0 auto",
  borderRadius: "16px",
  border: `1px solid ${t.colors.border}`,
};

export default EmailLayout;

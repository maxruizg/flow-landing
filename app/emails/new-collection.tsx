import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Img,
  Text,
  Button,
  Link,
  Hr,
  Preview,
} from "@react-email/components";
import * as t from "./theme";

interface Product {
  image: string;
  name: string;
  original_price: string;
  sale_price: string;
}

interface NewCollectionEmailProps {
  hero_title: string;
  hero_subtitle: string;
  hero_image: string;
  primary_color: string;
  products: Product[];
  cta_text: string;
  cta_url: string;
  preview?: string;
}

export function NewCollectionEmail({
  hero_title,
  hero_subtitle,
  hero_image,
  primary_color = t.colors.accent,
  products,
  cta_text,
  cta_url,
  preview,
}: NewCollectionEmailProps) {
  // Guard against a non-array `products` prop (e.g. malformed campaign
  // variables) so the template never throws at render time.
  const items = Array.isArray(products) ? products : [];
  return (
    <Html>
      <Head>
        <style dangerouslySetInnerHTML={{ __html: t.fontImportCss }} />
      </Head>
      <Preview>{preview || hero_title}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo Header */}
          <Section style={headerSection}>
            <Text style={logo}>FLOW</Text>
            <Text style={tagline}>URBAN WEAR</Text>
          </Section>

          <Hr style={divider} />

          {/* Hero Image */}
          <Section style={{ padding: "0" }}>
            <Img
              src={t.emailImageUrl(hero_image, 1200)}
              alt={hero_title}
              width="600"
              style={heroImage}
            />
          </Section>

          {/* Hero Text */}
          <Section style={heroTextSection}>
            <Text style={heroTitle}>{hero_title}</Text>
            <Text style={heroSubtitle}>{hero_subtitle}</Text>
          </Section>

          <Hr style={divider} />

          {/* Product Grid */}
          <Section style={productGridSection}>
            {items.length > 0 &&
              Array.from(
                { length: Math.ceil(items.length / 2) },
                (_, rowIndex) => {
                  const left = items[rowIndex * 2];
                  const right = items[rowIndex * 2 + 1];
                  return (
                    <Row key={rowIndex} style={{ marginBottom: "24px" }}>
                      <Column style={productColumn}>
                        <Img
                          src={t.emailImageUrl(left.image, 540)}
                          alt={left.name}
                          width="270"
                          style={productImage}
                        />
                        <Text style={productName}>{left.name}</Text>
                        <Text style={priceRow}>
                          <span style={originalPrice}>
                            {left.original_price}
                          </span>
                          <span style={{ ...salePrice, color: primary_color }}>
                            {left.sale_price}
                          </span>
                        </Text>
                      </Column>
                      {right ? (
                        <Column style={productColumn}>
                          <Img
                            src={t.emailImageUrl(right.image, 540)}
                            alt={right.name}
                            width="270"
                            style={productImage}
                          />
                          <Text style={productName}>{right.name}</Text>
                          <Text style={priceRow}>
                            <span style={originalPrice}>
                              {right.original_price}
                            </span>
                            <span
                              style={{ ...salePrice, color: primary_color }}
                            >
                              {right.sale_price}
                            </span>
                          </Text>
                        </Column>
                      ) : (
                        <Column style={productColumn} />
                      )}
                    </Row>
                  );
                }
              )}
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button href={cta_url} style={ctaButton}>
              {cta_text}
            </Button>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={socialLinks}>
              <Link href={t.brand.instagram} style={socialLink}>
                Instagram
              </Link>
              {"  ·  "}
              <Link href={t.brand.tiktok} style={socialLink}>
                TikTok
              </Link>
            </Text>
            <Text style={footerText}>
              Flow Urban Wear — Streetwear from Mexico City.
            </Text>
            <Text style={unsubscribeText}>
              You received this because you subscribed to Flow updates.{" "}
              <Link href={`${t.brand.site}/unsubscribe`} style={unsubscribeLink}>
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function getDefaultVariables(): NewCollectionEmailProps {
  return {
    hero_title: "NOCTURNA — Fall/Winter 2026",
    hero_subtitle:
      "Inspired by the neon-lit streets of Condesa. Oversized silhouettes meet raw textures.",
    hero_image: "https://placehold.co/600x400/1a1a1a/ffffff?text=NOCTURNA+COLLECTION",
    primary_color: t.colors.accent,
    products: [
      {
        image: "https://placehold.co/270x270/1a1a1a/ffffff?text=Oversized+Hoodie",
        name: "Oversized Hoodie — Midnight",
        original_price: "$1,890 MXN",
        sale_price: "$1,490 MXN",
      },
      {
        image: "https://placehold.co/270x270/1a1a1a/ffffff?text=Cargo+Pants",
        name: "Cargo Pants — Shadow",
        original_price: "$1,690 MXN",
        sale_price: "$1,290 MXN",
      },
      {
        image: "https://placehold.co/270x270/1a1a1a/ffffff?text=Graphic+Tee",
        name: "Graphic Tee — CDMX Nights",
        original_price: "$890 MXN",
        sale_price: "$690 MXN",
      },
      {
        image: "https://placehold.co/270x270/1a1a1a/ffffff?text=Bomber+Jacket",
        name: "Bomber Jacket — Concrete",
        original_price: "$2,490 MXN",
        sale_price: "$1,890 MXN",
      },
    ],
    cta_text: "Shop the Collection",
    cta_url: `${t.brand.site}/collections/nocturna`,
    preview: "The NOCTURNA collection just dropped. Dark silhouettes, limited stock.",
  };
}

/* ─── Styles ─── */

const fontFamily = t.fonts.body;

const main = {
  backgroundColor: "#0a0a0a",
  fontFamily,
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px",
};

const headerSection = {
  textAlign: "center" as const,
  padding: "20px 0",
};

const logo = {
  fontFamily: t.fonts.display,
  fontSize: "32px",
  fontWeight: "700" as const,
  letterSpacing: "0.3em",
  color: "#ffffff",
  margin: "0",
};

const tagline = {
  fontSize: "10px",
  letterSpacing: "0.4em",
  color: t.colors.accent,
  margin: "4px 0 0 0",
};

const divider = {
  borderColor: "#262626",
  margin: "24px 0",
};

const heroImage = {
  width: "100%",
  display: "block" as const,
};

const heroTextSection = {
  textAlign: "center" as const,
  padding: "32px 16px 8px 16px",
};

const heroTitle = {
  fontFamily: t.fonts.display,
  fontSize: "28px",
  fontWeight: "700" as const,
  color: "#ffffff",
  letterSpacing: "0.08em",
  lineHeight: "1.2",
  margin: "0 0 12px 0",
  textTransform: "uppercase" as const,
};

const heroSubtitle = {
  fontSize: "15px",
  lineHeight: "1.6",
  color: "#a3a3a3",
  margin: "0",
};

const productGridSection = {
  padding: "16px 0",
};

const productColumn = {
  width: "50%",
  verticalAlign: "top" as const,
  padding: "0 6px",
};

const productImage = {
  width: "100%",
  display: "block" as const,
  borderRadius: "4px",
};

const productName = {
  fontSize: "13px",
  fontWeight: "600" as const,
  color: "#ffffff",
  margin: "10px 0 4px 0",
  lineHeight: "1.3",
};

const priceRow = {
  fontSize: "13px",
  margin: "0",
  lineHeight: "1.4",
};

const originalPrice = {
  color: "#525252",
  textDecoration: "line-through" as const,
  marginRight: "8px",
};

const salePrice = {
  fontWeight: "600" as const,
};

const ctaSection = {
  textAlign: "center" as const,
  padding: "24px 0",
};

const ctaButton = {
  backgroundColor: t.colors.accent,
  color: "#0a0a0a",
  fontSize: "12px",
  fontWeight: "600" as const,
  letterSpacing: "0.15em",
  textTransform: "uppercase" as const,
  textDecoration: "none",
  padding: "14px 36px",
  borderRadius: "9999px",
  display: "inline-block",
};

const footerSection = {
  textAlign: "center" as const,
  padding: "8px 0 0 0",
};

const socialLinks = {
  fontSize: "13px",
  color: "#737373",
  margin: "0 0 16px 0",
};

const socialLink = {
  color: "#a3a3a3",
  textDecoration: "none",
};

const footerText = {
  fontSize: "12px",
  color: "#525252",
  margin: "0 0 8px 0",
};

const unsubscribeText = {
  fontSize: "11px",
  color: "#404040",
  margin: "0",
};

const unsubscribeLink = {
  color: "#525252",
  textDecoration: "underline",
};

export default NewCollectionEmail;

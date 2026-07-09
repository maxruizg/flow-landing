import {
  Section,
  Row,
  Column,
  Img,
  Text,
  Button,
  Hr,
} from "@react-email/components";
import * as t from "./theme";
import { EmailLayout, type EmailBrand } from "./EmailLayout";

interface Product {
  image: string;
  name: string;
  original_price: string;
  sale_price: string;
}

interface NewCollectionEmailProps extends EmailBrand {
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
  // Brand base.
  logoImage,
  backgroundImage,
  footerTagline,
  unsubscribeUrl,
}: NewCollectionEmailProps) {
  // Guard against a non-array `products` prop (e.g. malformed campaign
  // variables) so the template never throws at render time.
  const items = Array.isArray(products) ? products : [];
  // The campaign's primary_color IS the brand accent for this send.
  const accent = primary_color || t.colors.accent;

  return (
    <EmailLayout
      preview={preview || hero_title}
      accent={accent}
      logoImage={logoImage}
      backgroundImage={backgroundImage}
      footerTagline={footerTagline}
      unsubscribeUrl={unsubscribeUrl}
      marketing
    >
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

      <Hr style={t.divider} />

      {/* Product Grid */}
      <Section style={productGridSection}>
        {items.length > 0 &&
          Array.from({ length: Math.ceil(items.length / 2) }, (_, rowIndex) => {
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
                    <span style={originalPrice}>{left.original_price}</span>
                    <span style={{ ...salePrice, color: accent }}>
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
                      <span style={originalPrice}>{right.original_price}</span>
                      <span style={{ ...salePrice, color: accent }}>
                        {right.sale_price}
                      </span>
                    </Text>
                  </Column>
                ) : (
                  <Column style={productColumn} />
                )}
              </Row>
            );
          })}
      </Section>

      {/* CTA */}
      <Section style={ctaSection}>
        <Button
          href={cta_url}
          style={{ ...ctaButton, backgroundColor: accent }}
        >
          {cta_text}
        </Button>
      </Section>
    </EmailLayout>
  );
}

export function getDefaultVariables(): NewCollectionEmailProps {
  return {
    hero_title: "NOCTURNA — Fall/Winter 2026",
    hero_subtitle:
      "Inspired by the neon-lit streets of Condesa. Oversized silhouettes meet raw textures.",
    hero_image:
      "https://placehold.co/600x400/1a1a1a/ffffff?text=NOCTURNA+COLLECTION",
    primary_color: t.colors.accent,
    products: [
      {
        image:
          "https://placehold.co/270x270/1a1a1a/ffffff?text=Oversized+Hoodie",
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
    preview:
      "The NOCTURNA collection just dropped. Dark silhouettes, limited stock.",
  };
}

/* ─── Styles (content-only; frame lives in EmailLayout) ─── */

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
  color: t.colors.white,
  letterSpacing: "0.08em",
  lineHeight: "1.2",
  margin: "0 0 12px 0",
  textTransform: "uppercase" as const,
};

const heroSubtitle = {
  fontFamily: t.fonts.body,
  fontSize: "15px",
  lineHeight: "1.6",
  color: t.colors.textMuted,
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
  fontFamily: t.fonts.body,
  fontSize: "13px",
  fontWeight: "600" as const,
  color: t.colors.white,
  margin: "10px 0 4px 0",
  lineHeight: "1.3",
};

const priceRow = {
  fontFamily: t.fonts.body,
  fontSize: "13px",
  margin: "0",
  lineHeight: "1.4",
};

const originalPrice = {
  color: t.colors.textGhost,
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
  fontFamily: t.fonts.body,
  color: t.colors.black,
  fontSize: "12px",
  fontWeight: "600" as const,
  letterSpacing: "0.15em",
  textTransform: "uppercase" as const,
  textDecoration: "none",
  padding: "14px 36px",
  borderRadius: "9999px",
  display: "inline-block",
};

export default NewCollectionEmail;

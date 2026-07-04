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

interface ProductLaunchEmailProps {
  product_name: string;
  product_description: string;
  hero_image: string;
  gallery_images: string[];
  // The admin editor saves this as a comma-separated string ("S, M, L"),
  // but seed/programmatic callers may pass an array. Accept both.
  available_sizes: string | string[];
  price: string;
  accent_color: string;
  brand_story: string;
  preview?: string;
  cta_text?: string;
  cta_url?: string;
}

export function ProductLaunchEmail({
  product_name,
  product_description,
  hero_image,
  gallery_images,
  available_sizes,
  price,
  accent_color = t.colors.accent,
  brand_story,
  preview,
  cta_text = "Buy Now",
  cta_url = `${t.brand.site}/shop`,
}: ProductLaunchEmailProps) {
  // Tolerate both the editor's comma-separated string and an array so a
  // "Product Launch" campaign never throws at render time (which would make
  // sendCampaign mark it failed and email nobody).
  const sizes = Array.isArray(available_sizes)
    ? available_sizes
    : String(available_sizes || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
  return (
    <Html>
      <Head>
        <style dangerouslySetInnerHTML={{ __html: t.fontImportCss }} />
      </Head>
      <Preview>{preview || `Introducing ${product_name} — Now available`}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo Header */}
          <Section style={headerSection}>
            <Text style={logo}>FLOW</Text>
            <Text style={tagline}>URBAN WEAR</Text>
          </Section>

          <Hr style={divider} />

          {/* Intro Label */}
          <Section style={introSection}>
            <Text style={introLabel}>NEW RELEASE</Text>
          </Section>

          {/* Hero Product Image */}
          <Section style={{ padding: "0" }}>
            <Img
              src={t.emailImageUrl(hero_image, 1200)}
              alt={product_name}
              width="600"
              style={heroImage}
            />
          </Section>

          {/* Product Info */}
          <Section style={productInfoSection}>
            <Text style={productName}>{product_name}</Text>
            <Text style={{ ...priceText, color: accent_color }}>{price}</Text>
            <Text style={descriptionText}>{product_description}</Text>
          </Section>

          <Hr style={divider} />

          {/* Gallery Row */}
          {gallery_images.length >= 3 && (
            <Section style={gallerySection}>
              <Text style={sectionLabel}>DETAILS</Text>
              <Row>
                <Column style={galleryColumn}>
                  <Img
                    src={t.emailImageUrl(gallery_images[0], 360)}
                    alt={`${product_name} detail 1`}
                    width="180"
                    style={galleryImage}
                  />
                </Column>
                <Column style={galleryColumn}>
                  <Img
                    src={t.emailImageUrl(gallery_images[1], 360)}
                    alt={`${product_name} detail 2`}
                    width="180"
                    style={galleryImage}
                  />
                </Column>
                <Column style={galleryColumn}>
                  <Img
                    src={t.emailImageUrl(gallery_images[2], 360)}
                    alt={`${product_name} detail 3`}
                    width="180"
                    style={galleryImage}
                  />
                </Column>
              </Row>
            </Section>
          )}

          <Hr style={divider} />

          {/* Available Sizes */}
          <Section style={sizesSection}>
            <Text style={sectionLabel}>AVAILABLE SIZES</Text>
            <Text style={sizeBadgesRow}>
              {sizes.map((size, i) => (
                <span key={i}>
                  <span style={sizeBadge}>{size}</span>
                  {i < sizes.length - 1 ? "  " : ""}
                </span>
              ))}
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Brand Story */}
          <Section style={brandStorySection}>
            <Text style={brandStoryLabel}>THE STORY</Text>
            <Text style={brandStoryText}>{brand_story}</Text>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button
              href={cta_url}
              style={{ ...ctaButton, backgroundColor: accent_color }}
            >
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
              <Link
                href={`${t.brand.site}/unsubscribe`}
                style={unsubscribeLink}
              >
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function getDefaultVariables(): ProductLaunchEmailProps {
  return {
    product_name: "Shadow Bomber Jacket",
    product_description:
      "Heavyweight cotton-nylon shell with a matte black finish. Ribbed collar, cuffs, and hem. Interior pocket with FLOW embossed zipper pull. Relaxed fit, designed to layer over hoodies. Made in small batches in Mexico City.",
    hero_image:
      "https://placehold.co/600x600/1a1a1a/ffffff?text=SHADOW+BOMBER",
    gallery_images: [
      "https://placehold.co/180x180/1a1a1a/ffffff?text=Detail+1",
      "https://placehold.co/180x180/1a1a1a/ffffff?text=Detail+2",
      "https://placehold.co/180x180/1a1a1a/ffffff?text=Detail+3",
    ],
    available_sizes: ["S", "M", "L", "XL", "XXL"],
    price: "$2,890 MXN",
    accent_color: t.colors.accent,
    brand_story:
      "Every FLOW piece is born in a small workshop in Colonia Roma, Mexico City. We believe streetwear should tell a story — of late nights, loud music, and the restless energy of the city. The Shadow Bomber is our love letter to the concrete jungle we call home.",
    preview:
      "The Shadow Bomber Jacket is here. Limited run. Once it's gone, it's gone.",
    cta_text: "Reserve Yours",
    cta_url: `${t.brand.site}/products/shadow-bomber`,
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

const introSection = {
  textAlign: "center" as const,
  padding: "0 0 8px 0",
};

const introLabel = {
  fontSize: "11px",
  fontWeight: "700" as const,
  letterSpacing: "0.3em",
  color: "#737373",
  margin: "0",
};

const heroImage = {
  width: "100%",
  display: "block" as const,
};

const productInfoSection = {
  textAlign: "center" as const,
  padding: "32px 16px 8px 16px",
};

const productName = {
  fontFamily: t.fonts.display,
  fontSize: "30px",
  fontWeight: "700" as const,
  color: "#ffffff",
  letterSpacing: "0.04em",
  lineHeight: "1.2",
  margin: "0 0 8px 0",
  textTransform: "uppercase" as const,
};

const priceText = {
  fontSize: "20px",
  fontWeight: "600" as const,
  margin: "0 0 20px 0",
};

const descriptionText = {
  fontSize: "15px",
  lineHeight: "1.7",
  color: "#a3a3a3",
  margin: "0",
  textAlign: "left" as const,
};

const gallerySection = {
  padding: "0 0 8px 0",
};

const sectionLabel = {
  fontSize: "11px",
  fontWeight: "700" as const,
  letterSpacing: "0.25em",
  color: "#737373",
  textAlign: "center" as const,
  margin: "0 0 16px 0",
};

const galleryColumn = {
  width: "33.33%",
  verticalAlign: "top" as const,
  padding: "0 3px",
};

const galleryImage = {
  width: "100%",
  display: "block" as const,
  borderRadius: "4px",
};

const sizesSection = {
  textAlign: "center" as const,
  padding: "0",
};

const sizeBadgesRow = {
  fontSize: "14px",
  color: "#ffffff",
  margin: "0",
  lineHeight: "2.4",
};

const sizeBadge = {
  display: "inline-block" as const,
  border: "1px solid #404040",
  borderRadius: "4px",
  padding: "6px 14px",
  fontSize: "13px",
  fontWeight: "600" as const,
  color: "#d4d4d4",
  letterSpacing: "0.05em",
};

const brandStorySection = {
  padding: "0 8px",
};

const brandStoryLabel = {
  fontSize: "11px",
  fontWeight: "700" as const,
  letterSpacing: "0.25em",
  color: "#737373",
  textAlign: "center" as const,
  margin: "0 0 12px 0",
};

const brandStoryText = {
  fontSize: "14px",
  lineHeight: "1.8",
  color: "#737373",
  fontStyle: "italic" as const,
  margin: "0",
  textAlign: "center" as const,
};

const ctaSection = {
  textAlign: "center" as const,
  padding: "32px 0 24px 0",
};

const ctaButton = {
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: "700" as const,
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  textDecoration: "none",
  padding: "16px 40px",
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

export default ProductLaunchEmail;

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

interface Category {
  image: string;
  name: string;
  // The admin editor / schema store this as `discount_pct`; older sample data
  // used `discount`. Accept either so the text never renders blank.
  discount_pct?: string;
  discount?: string;
}

interface FlashSaleEmailProps extends EmailBrand {
  discount_percentage: string;
  expiration_text: string;
  banner_image: string;
  urgency_color: string;
  categories: Category[];
  coupon_code: string;
  preview?: string;
  cta_text?: string;
  cta_url?: string;
}

export function FlashSaleEmail({
  discount_percentage,
  expiration_text,
  banner_image,
  urgency_color = t.colors.accent,
  categories,
  coupon_code,
  preview,
  cta_text = "Shop the Sale",
  cta_url = `${t.brand.site}/sale`,
  // Brand base.
  logoImage,
  backgroundImage,
  footerTagline,
  unsubscribeUrl,
}: FlashSaleEmailProps) {
  // Guard against a non-array `categories` prop so the template never throws
  // at render time. (Named `cats` to avoid colliding with the per-row `items`
  // slice used inside the category grid below.)
  const cats = Array.isArray(categories) ? categories : [];
  // urgency_color IS the accent for this send (drives the header tagline too).
  const accent = urgency_color || t.colors.accent;

  return (
    <EmailLayout
      preview={preview || `${discount_percentage} OFF — ${expiration_text}`}
      accent={accent}
      logoImage={logoImage}
      backgroundImage={backgroundImage}
      footerTagline={footerTagline}
      unsubscribeUrl={unsubscribeUrl}
      marketing
    >
      {/* Discount Hero */}
      <Section style={discountSection}>
        <Text style={{ ...discountText, color: accent }}>
          {discount_percentage}
        </Text>
        <Text style={discountLabel}>OFF EVERYTHING</Text>
        <Text style={expirationStyle}>{expiration_text}</Text>
      </Section>

      {/* Banner Image */}
      <Section style={{ padding: "0" }}>
        <Img
          src={t.emailImageUrl(banner_image, 1200)}
          alt="Flash Sale"
          width="600"
          style={bannerImage}
        />
      </Section>

      <Hr style={t.divider} />

      {/* Category Cards */}
      <Section style={categoriesSection}>
        <Text style={sectionTitle}>SHOP BY CATEGORY</Text>
        {Array.from({ length: Math.ceil(cats.length / 3) }, (_, rowIndex) => {
          const items = cats.slice(rowIndex * 3, rowIndex * 3 + 3);
          return (
            <Row key={rowIndex} style={{ marginBottom: "16px" }}>
              {items.map((cat, i) => (
                <Column key={i} style={categoryColumn}>
                  <Img
                    src={t.emailImageUrl(cat.image, 360)}
                    alt={cat.name}
                    width="180"
                    style={categoryImage}
                  />
                  <Text style={categoryName}>{cat.name}</Text>
                  <Text style={{ ...categoryDiscount, color: accent }}>
                    {cat.discount_pct ?? cat.discount}
                  </Text>
                </Column>
              ))}
              {/* Fill empty columns for alignment */}
              {items.length < 3 &&
                Array.from({ length: 3 - items.length }, (_, i) => (
                  <Column key={`empty-${i}`} style={categoryColumn} />
                ))}
            </Row>
          );
        })}
      </Section>

      <Hr style={t.divider} />

      {/* Coupon Code Box */}
      <Section style={couponSection}>
        <Text style={couponLabel}>YOUR EXCLUSIVE CODE</Text>
        <Section style={couponBox}>
          <Text style={couponCodeText}>{coupon_code}</Text>
        </Section>
        <Text style={couponHint}>Apply at checkout. One use per customer.</Text>
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

export function getDefaultVariables(): FlashSaleEmailProps {
  return {
    discount_percentage: "50%",
    expiration_text: "Ends Sunday at midnight — CDMX time",
    banner_image:
      "https://placehold.co/600x300/1a1a1a/ffffff?text=FLASH+SALE+%E2%80%94+LIMITED+TIME",
    urgency_color: t.colors.accent,
    categories: [
      {
        image: "https://placehold.co/180x180/1a1a1a/ffffff?text=Hoodies",
        name: "Hoodies",
        discount_pct: "Up to 50% off",
      },
      {
        image: "https://placehold.co/180x180/1a1a1a/ffffff?text=Pants",
        name: "Pants",
        discount_pct: "Up to 40% off",
      },
      {
        image: "https://placehold.co/180x180/1a1a1a/ffffff?text=Tees",
        name: "Graphic Tees",
        discount_pct: "Up to 35% off",
      },
    ],
    coupon_code: "FLASH50",
    preview: "50% OFF everything. This weekend only. Don't sleep on it.",
    cta_text: "Shop the Sale",
    cta_url: `${t.brand.site}/sale`,
  };
}

/* ─── Styles (content-only; frame lives in EmailLayout) ─── */

const discountSection = {
  textAlign: "center" as const,
  padding: "32px 0 24px 0",
};

const discountText = {
  fontFamily: t.fonts.display,
  fontSize: "72px",
  fontWeight: "800" as const,
  letterSpacing: "-0.02em",
  lineHeight: "1",
  margin: "0",
};

const discountLabel = {
  fontFamily: t.fonts.display,
  fontSize: "18px",
  fontWeight: "700" as const,
  letterSpacing: "0.25em",
  color: t.colors.white,
  margin: "8px 0 0 0",
};

const expirationStyle = {
  fontFamily: t.fonts.body,
  fontSize: "14px",
  color: t.colors.textMuted,
  margin: "12px 0 0 0",
  lineHeight: "1.4",
};

const bannerImage = {
  width: "100%",
  display: "block" as const,
};

const categoriesSection = {
  padding: "16px 0",
};

const sectionTitle = {
  fontFamily: t.fonts.body,
  fontSize: "12px",
  fontWeight: "700" as const,
  letterSpacing: "0.2em",
  color: t.colors.textFaint,
  textAlign: "center" as const,
  margin: "0 0 20px 0",
};

const categoryColumn = {
  width: "33.33%",
  verticalAlign: "top" as const,
  padding: "0 4px",
  textAlign: "center" as const,
};

const categoryImage = {
  width: "100%",
  display: "block" as const,
  borderRadius: "4px",
};

const categoryName = {
  fontFamily: t.fonts.body,
  fontSize: "13px",
  fontWeight: "600" as const,
  color: t.colors.white,
  margin: "10px 0 2px 0",
};

const categoryDiscount = {
  fontFamily: t.fonts.body,
  fontSize: "12px",
  fontWeight: "600" as const,
  margin: "0",
};

const couponSection = {
  textAlign: "center" as const,
  padding: "8px 0 16px 0",
};

const couponLabel = {
  fontFamily: t.fonts.body,
  fontSize: "11px",
  fontWeight: "700" as const,
  letterSpacing: "0.2em",
  color: t.colors.textFaint,
  margin: "0 0 12px 0",
};

const couponBox = {
  border: `2px dashed ${t.colors.borderFaint}`,
  borderRadius: "8px",
  padding: "16px 24px",
  margin: "0 auto",
  maxWidth: "280px",
};

const couponCodeText = {
  fontFamily: t.fonts.display,
  fontSize: "28px",
  fontWeight: "800" as const,
  letterSpacing: "0.15em",
  color: t.colors.white,
  margin: "0",
  textAlign: "center" as const,
};

const couponHint = {
  fontFamily: t.fonts.body,
  fontSize: "12px",
  color: t.colors.textGhost,
  margin: "10px 0 0 0",
};

const ctaSection = {
  textAlign: "center" as const,
  padding: "16px 0 24px 0",
};

const ctaButton = {
  fontFamily: t.fonts.body,
  color: t.colors.white,
  fontSize: "13px",
  fontWeight: "700" as const,
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  textDecoration: "none",
  padding: "16px 40px",
  borderRadius: "9999px",
  display: "inline-block",
};

export default FlashSaleEmail;

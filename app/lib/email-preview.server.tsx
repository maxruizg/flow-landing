/**
 * Server-only helper to render ANY email template to HTML with a given brand
 * base + realistic sample data. Powers the in-admin live preview and the
 * "send test email" flow in app/routes/admin.email-design.tsx.
 *
 * `.server.tsx` → stripped from the client bundle (never ships the templates
 * or @react-email/render to the browser).
 */
import { render } from "@react-email/render";
import type { EmailBrandSettings } from "~/data/queries.server";
import type { PreviewTemplateKey } from "~/lib/email-templates";
import { OrderConfirmationEmail } from "~/emails/order-confirmation";
import { OrderShippedEmail } from "~/emails/order-shipped";
import { AbandonedCartEmail } from "~/emails/abandoned-cart";
import { NewCollectionEmail } from "~/emails/new-collection";
import { FlashSaleEmail } from "~/emails/flash-sale";
import { ProductLaunchEmail } from "~/emails/product-launch";

// Realistic sample product images (public FLOW catalog).
const P = [
  {
    img: "https://bnqmxddffoxwprwecksu.supabase.co/storage/v1/render/image/public/images/products/1780032315113-7sx5av9pzji.png?width=1280&quality=85&resize=contain",
    name: "Back Crop Top — Black",
    price: 780,
  },
  {
    img: "https://bnqmxddffoxwprwecksu.supabase.co/storage/v1/render/image/public/images/products/1780030787181-jlpwrik6sx.png?width=1280&quality=85&resize=contain",
    name: "Long Sleeve Crop Top — Black",
    price: 880,
  },
  {
    img: "https://bnqmxddffoxwprwecksu.supabase.co/storage/v1/render/image/public/images/products/1780030089484-2dfyrpb1ye7.png?width=1280&quality=85&resize=contain",
    name: "LTMF Crop Top — Black",
    price: 1170,
  },
  {
    img: "https://bnqmxddffoxwprwecksu.supabase.co/storage/v1/render/image/public/images/products/1780354367639-xfrmguge9cg.jpg?width=1280&quality=85&resize=contain",
    name: "Mantis Crop Top — Black",
    price: 1170,
  },
];
const mx = (n: number) => `$${n.toLocaleString("es-MX")} MXN`;
const sampleItems = [
  {
    productName: P[0].name,
    colorName: "Black",
    size: "M",
    quantity: 1,
    price: P[0].price,
    image: P[0].img,
  },
  {
    productName: P[1].name,
    colorName: "Black",
    size: "L",
    quantity: 2,
    price: P[1].price,
    image: P[1].img,
  },
  {
    productName: P[2].name,
    colorName: "Black",
    size: "S",
    quantity: 1,
    price: P[2].price,
    image: P[2].img,
  },
  {
    productName: P[3].name,
    colorName: "Black",
    size: "M",
    quantity: 3,
    price: P[3].price,
    image: P[3].img,
  },
];

/** Render a template to HTML with the given brand base applied. Empty brand
 *  fields fall back to the templates' own theme defaults. */
export async function renderEmailPreview(
  key: PreviewTemplateKey,
  brand: EmailBrandSettings,
): Promise<string> {
  // Shared brand props (undefined-safe: templates fall back to theme).
  const b = {
    accent: brand.accent,
    logoImage: brand.logoImage,
    backgroundImage: brand.backgroundImage,
    footerTagline: brand.footerTagline,
    unsubscribeUrl: brand.unsubscribeUrl,
  };
  const heroFallback = brand.defaultHeroImage || P[3].img;

  switch (key) {
    case "order_confirmation":
      return render(
        OrderConfirmationEmail({
          orderId: "FLOW-PREVIEW",
          customerName: "Dany",
          items: sampleItems,
          total: 2540,
          currency: "mxn",
          heroImage: heroFallback,
          accent: b.accent,
          logoImage: b.logoImage,
          backgroundImage: b.backgroundImage,
          footerTagline: b.footerTagline,
        }),
      );
    case "order_shipped":
      return render(
        OrderShippedEmail({
          orderId: "FLOW-PREVIEW",
          customerName: "Dany",
          items: sampleItems,
          trackingNumber: "1234567890",
          carrier: "DHL",
          accent: b.accent,
          logoImage: b.logoImage,
          backgroundImage: b.backgroundImage,
          footerTagline: b.footerTagline,
        }),
      );
    case "abandoned_cart":
      return render(
        AbandonedCartEmail({
          customerName: "Dany Flores",
          items: sampleItems,
          total: 2540,
          currency: "mxn",
          ...b,
        }),
      );
    case "new_collection":
      return render(
        NewCollectionEmail({
          hero_title: "NUEVA COLECCIÓN",
          hero_subtitle:
            "Crop tops en negro, café y off white. Edición limitada.",
          hero_image: heroFallback,
          primary_color: b.accent || "#b8a490",
          products: P.map((p) => ({
            image: p.img,
            name: p.name,
            original_price: mx(Math.round(p.price * 1.25)),
            sale_price: mx(p.price),
          })),
          cta_text: "Ver la colección",
          cta_url: "https://www.flowurbanwear.com/showroom",
          logoImage: b.logoImage,
          backgroundImage: b.backgroundImage,
          footerTagline: b.footerTagline,
          unsubscribeUrl: b.unsubscribeUrl,
        }),
      );
    case "flash_sale":
      return render(
        FlashSaleEmail({
          discount_percentage: "30%",
          expiration_text: "Termina el domingo a medianoche — CDMX",
          banner_image: heroFallback,
          urgency_color: b.accent || "#b8a490",
          categories: [
            {
              image: P[0].img,
              name: "Crop Tops",
              discount_pct: "Hasta 30% off",
            },
            {
              image: P[1].img,
              name: "Long Sleeve",
              discount_pct: "Hasta 25% off",
            },
            {
              image: P[2].img,
              name: "Basketball",
              discount_pct: "Hasta 20% off",
            },
          ],
          coupon_code: "FLOW30",
          cta_text: "Ver la venta",
          cta_url: "https://www.flowurbanwear.com/showroom",
          logoImage: b.logoImage,
          backgroundImage: b.backgroundImage,
          footerTagline: b.footerTagline,
          unsubscribeUrl: b.unsubscribeUrl,
        }),
      );
    case "product_launch":
      return render(
        ProductLaunchEmail({
          product_name: P[3].name,
          product_description:
            "Corte crop, algodón pesado, acabado mate. Hecho en lotes pequeños en CDMX.",
          hero_image: heroFallback,
          gallery_images: [P[0].img, P[1].img, P[2].img],
          available_sizes: ["S", "M", "L", "XL"],
          price: mx(P[3].price),
          accent_color: b.accent || "#b8a490",
          brand_story:
            "Cada pieza FLOW nace en un taller en la Roma, CDMX. Streetwear que cuenta una historia.",
          cta_text: "Reservar",
          cta_url: "https://www.flowurbanwear.com/showroom",
          logoImage: b.logoImage,
          backgroundImage: b.backgroundImage,
          footerTagline: b.footerTagline,
          unsubscribeUrl: b.unsubscribeUrl,
        }),
      );
  }
}

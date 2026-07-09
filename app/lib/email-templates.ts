/**
 * Client-safe list of email templates offered in the admin preview/test
 * dropdown (app/routes/admin.email-design.tsx). Kept separate from
 * email-preview.server.tsx so the labels/keys can be imported by the browser
 * component without pulling the server-only render code.
 */
export const PREVIEW_TEMPLATES = [
  { key: "order_confirmation", label: "Confirmación de compra" },
  { key: "order_shipped", label: "Pedido enviado" },
  { key: "abandoned_cart", label: "Carrito abandonado" },
  { key: "new_collection", label: "Campaña · Nueva colección" },
  { key: "flash_sale", label: "Campaña · Flash sale" },
  { key: "product_launch", label: "Campaña · Lanzamiento" },
] as const;

export type PreviewTemplateKey = (typeof PREVIEW_TEMPLATES)[number]["key"];

export function isPreviewTemplateKey(v: string): v is PreviewTemplateKey {
  return PREVIEW_TEMPLATES.some((t) => t.key === v);
}

/** Subject line used when sending each sample as a test email. */
export function previewSubject(key: PreviewTemplateKey): string {
  const map: Record<PreviewTemplateKey, string> = {
    order_confirmation: "[Prueba] Confirmación de compra — FLOW",
    order_shipped: "[Prueba] Tu pedido va en camino — FLOW",
    abandoned_cart: "[Prueba] Dejaste algo en tu carrito — FLOW",
    new_collection: "[Prueba] Nueva colección — FLOW",
    flash_sale: "[Prueba] Flash sale — FLOW",
    product_launch: "[Prueba] Nuevo lanzamiento — FLOW",
  };
  return map[key];
}

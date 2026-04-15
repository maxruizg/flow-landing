import { redirect } from "@remix-run/node";
import type { MetaFunction, ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { requireAdmin } from "~/lib/session.server";
import { upsertProduct, getMaxProductPosition, getAdminProducts, updateProductPositions } from "~/data/queries.server";
import { ProductForm } from "~/components/admin/ProductForm";
import { slugify } from "~/lib/utils";

export const meta: MetaFunction = () => [{ title: "FLOW Admin — New Product" }];

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();

  // Shared fields
  const name = form.get("name") as string;
  const price = Number(form.get("price"));
  const priceMxn = Number(form.get("price_mxn"));
  const category = form.get("category") as string;
  const gender = form.get("gender") as string;
  const sizesRaw = (form.get("sizes_raw") as string) || "";
  const sizes = sizesRaw.split(",").map((s) => s.trim()).filter(Boolean);
  const material = form.get("material") as string;
  const description = form.get("description") as string;
  const origin = (form.get("origin") as string) || "Made in Mexico";
  const fit = (form.get("fit") as string) || null;

  // Process variants
  const variantsCount = Number(form.get("variants_count"));
  const displayPosition = (form.get("display_position") as string) || "last";
  const maxPos = await getMaxProductPosition();

  // If placing at the beginning, shift all existing products down
  if (displayPosition === "first") {
    const existing = await getAdminProducts();
    const shifted = existing.map((p) => ({ id: p.id, position: p.position + variantsCount }));
    await updateProductPositions(shifted);
  }

  for (let i = 0; i < variantsCount; i++) {
    const variantId = form.get(`variant_${i}_id`) as string;
    const color = form.get(`variant_${i}_color`) as string;

    // Images are already uploaded — just read the URLs
    const image = (form.get(`variant_${i}_image`) as string) || "";
    const imageHover = (form.get(`variant_${i}_imageHover`) as string) || "";
    const galleryRaw = (form.get(`variant_${i}_gallery`) as string) || "[]";
    const images: string[] = JSON.parse(galleryRaw);
    const sizeStockRaw = (form.get(`variant_${i}_size_stock`) as string) || "{}";
    const sizeStock: Record<string, number> = JSON.parse(sizeStockRaw);
    const variantStatus = (form.get(`variant_${i}_status`) as string) || "active";
    const variantBadgeRaw = (form.get(`variant_${i}_badge`) as string) || "";
    const variantBadge = variantBadgeRaw || null;
    const variantIsNew = form.get(`variant_${i}_isNew`) === "true";

    const finalId = variantId.startsWith("new-")
      ? `p-${Date.now()}-${i}`
      : variantId;

    const slug = slugify(name, color, gender);
    const position = displayPosition === "first" ? i + 1 : maxPos + 1 + i;

    await upsertProduct({
      id: finalId,
      slug,
      name,
      price,
      priceMxn,
      image,
      imageHover,
      images,
      category,
      badge: variantBadge,
      sizes,
      sizeStock,
      isNew: variantIsNew,
      description,
      material,
      origin,
      color,
      fit,
      gender,
      status: variantStatus,
      position,
    });
  }

  return redirect("/admin/products");
}

export default function NewProductPage() {
  return <ProductForm product={null} siblings={null} />;
}

import type { MetaFunction, ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { requireAdmin } from "~/lib/session.server";
import { redirectWithToast } from "~/lib/toast.server";
import {
  getAdminProducts,
  getMaxProductPosition,
  setDefaultVariant,
  updateProductPositions,
  upsertBaseProduct,
  upsertVariants,
} from "~/data/queries.server";
import { ProductForm } from "~/components/admin/ProductForm";
import { slugify } from "~/lib/utils";

export const meta: MetaFunction = () => [{ title: "FLOW Admin — New Product" }];

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  return null;
}

function kebab(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();

  const name = form.get("name") as string;
  const category = form.get("category") as string;
  const gender = form.get("gender") as "men" | "women" | "unisex";
  const sizes = ((form.get("sizes_raw") as string) || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const material = (form.get("material") as string) || "";
  const origin = (form.get("origin") as string) || "Made in Mexico";
  const fit = (form.get("fit") as string) || null;
  const tags = ((form.get("tags_raw") as string) || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const brand = (form.get("brand") as string) || null;

  const displayPosition = (form.get("display_position") as string) || "last";
  const variantsCount = Number(form.get("variants_count"));
  const defaultVariantIndexRaw = form.get("default_variant_index") as string | null;

  const baseProductId = `p-${kebab(name)}-${gender}`.replace(/-+/g, "-");
  const baseSlug = `${kebab(name)}-${gender}`.replace(/-+/g, "-");

  // Position: shift existing if inserting at top.
  const maxPos = await getMaxProductPosition();
  let productPosition: number;
  if (displayPosition === "first") {
    const existing = await getAdminProducts();
    const shifted = existing.map((p) => ({ id: p.id, position: p.position + 1 }));
    await updateProductPositions(shifted);
    productPosition = 1;
  } else {
    productPosition = maxPos + 1;
  }

  await upsertBaseProduct({
    id: baseProductId,
    slug: baseSlug,
    name,
    category,
    gender,
    material,
    origin,
    fit,
    sizes,
    tags,
    brand,
    position: productPosition,
  });

  const variantInputs = [];
  let firstVariantId: string | null = null;
  let defaultVariantId: string | null = null;

  for (let i = 0; i < variantsCount; i++) {
    const rawId = form.get(`variant_${i}_id`) as string;
    const colorName = (form.get(`variant_${i}_color`) as string) || "";
    const colorHex = (form.get(`variant_${i}_color_hex`) as string) || null;
    const sku =
      (form.get(`variant_${i}_sku`) as string) ||
      `${baseSlug}-${kebab(colorName)}`;
    const price = Number(form.get(`variant_${i}_price`));
    const priceMxn = Number(form.get(`variant_${i}_price_mxn`) ?? 0);
    const compareAtRaw = form.get(`variant_${i}_compare_at_price`) as string | null;
    const compareAtPrice = compareAtRaw && compareAtRaw !== "" ? Number(compareAtRaw) : null;
    const image = (form.get(`variant_${i}_image`) as string) || "";
    const imageHover = (form.get(`variant_${i}_imageHover`) as string) || "";
    const gallery: string[] = JSON.parse((form.get(`variant_${i}_gallery`) as string) || "[]");
    const sizeStock: Record<string, number> = JSON.parse(
      (form.get(`variant_${i}_size_stock`) as string) || "{}",
    );
    const status = (form.get(`variant_${i}_status`) as "active" | "draft" | "archived") || "active";
    const badgeRaw = form.get(`variant_${i}_badge`) as string;
    const badge = badgeRaw ? badgeRaw : null;
    const isNew = form.get(`variant_${i}_isNew`) === "true";
    const description = (form.get(`variant_${i}_description`) as string) || "";

    const finalId = rawId.startsWith("new-") ? `v-${baseProductId}-${kebab(colorName)}` : rawId;
    const variantSlug = `${baseSlug}-${kebab(colorName)}`;

    if (firstVariantId === null) firstVariantId = finalId;
    if (defaultVariantIndexRaw && Number(defaultVariantIndexRaw) === i) {
      defaultVariantId = finalId;
    }

    variantInputs.push({
      id: finalId,
      productId: baseProductId,
      slug: variantSlug,
      colorName,
      colorHex,
      sku,
      price,
      priceMxn,
      compareAtPrice,
      sizeStock,
      status,
      image,
      imageHover,
      images: gallery,
      badge,
      isNew,
      sortOrder: i + 1,
      description,
    });
  }

  await upsertVariants(variantInputs);
  await setDefaultVariant(baseProductId, defaultVariantId ?? firstVariantId);

  return redirectWithToast("/admin/products", {
    type: "success",
    message: `“${name}” created.`,
  });
}

export default function NewProductPage() {
  return <ProductForm product={null} siblings={null} />;
}

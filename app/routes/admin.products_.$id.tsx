import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type {
  MetaFunction,
  LoaderFunctionArgs,
  ActionFunctionArgs,
} from "@remix-run/node";
import { requireAdmin } from "~/lib/session.server";
import {
  deleteVariants,
  getAdminProductById,
  setDefaultVariant,
  upsertBaseProduct,
  upsertVariants,
} from "~/data/queries.server";
import { ProductForm } from "~/components/admin/ProductForm";

export const meta: MetaFunction = () => [{ title: "FLOW Admin — Edit Product" }];

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireAdmin(request);
  const product = await getAdminProductById(params.id!);
  if (!product) {
    throw new Response("Product not found", { status: 404 });
  }
  return json({ product });
}

function kebab(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export async function action({ request, params }: ActionFunctionArgs) {
  const form = await request.formData();
  const baseProductId = params.id!;

  const name = form.get("name") as string;
  const description = form.get("description") as string;
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

  const existing = await getAdminProductById(baseProductId);
  if (!existing) throw new Response("Product not found", { status: 404 });
  const baseSlug = existing.slug;

  await upsertBaseProduct({
    id: baseProductId,
    slug: baseSlug,
    name,
    description,
    category,
    gender,
    material,
    origin,
    fit,
    sizes,
    tags,
    brand,
  });

  // Delete removed variants.
  const deletedRaw = form.get("deleted_variant_ids") as string;
  if (deletedRaw) {
    const deletedIds: string[] = JSON.parse(deletedRaw);
    if (deletedIds.length) await deleteVariants(deletedIds);
  }

  const variantsCount = Number(form.get("variants_count"));
  const defaultVariantIndexRaw = form.get("default_variant_index") as string | null;

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
    });
  }

  await upsertVariants(variantInputs);
  await setDefaultVariant(baseProductId, defaultVariantId ?? firstVariantId);

  return redirect("/admin/products");
}

export default function EditProductPage() {
  const { product } = useLoaderData<typeof loader>();
  return <ProductForm product={product as any} siblings={null} />;
}

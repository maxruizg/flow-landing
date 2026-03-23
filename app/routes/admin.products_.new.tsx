import { redirect } from "@remix-run/node";
import type { MetaFunction, ActionFunctionArgs } from "@remix-run/node";
import { uploadImage } from "~/lib/supabase.server";
import { upsertProduct, getMaxProductPosition } from "~/data/queries.server";
import { ProductForm } from "~/components/admin/ProductForm";
import { slugify } from "~/lib/utils";

export const meta: MetaFunction = () => [{ title: "FLOW Admin — New Product" }];

async function resolveImage(
  formData: FormData,
  fieldName: string
): Promise<string> {
  const file = formData.get(fieldName);
  const existing = formData.get(`${fieldName}_existing`) as string | null;

  if (file && file instanceof File && file.size > 0) {
    return uploadImage(file, "products");
  }
  return existing || "";
}

async function resolveGalleryIndexed(
  formData: FormData,
  index: number
): Promise<string[]> {
  const kept = formData.getAll(`variant_${index}_gallery_existing`) as string[];
  const newFiles = formData.getAll(`variant_${index}_gallery_new`);
  const uploaded: string[] = [];
  for (const file of newFiles) {
    if (file instanceof File && file.size > 0) {
      uploaded.push(await uploadImage(file, "products"));
    }
  }
  return [...kept, ...uploaded];
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();

  // Shared fields
  const name = form.get("name") as string;
  const price = Number(form.get("price"));
  const category = form.get("category") as string;
  const gender = form.get("gender") as string;
  const sizesRaw = (form.get("sizes_raw") as string) || "";
  const sizes = sizesRaw.split(",").map((s) => s.trim()).filter(Boolean);
  const material = form.get("material") as string;
  const description = form.get("description") as string;
  const origin = (form.get("origin") as string) || "Made in Mexico";
  const fit = (form.get("fit") as string) || null;
  const badge = (form.get("badge") as string) || null;
  const isNew = form.get("isNew") === "true";
  const status = form.get("status") as string;
  const stock = Number(form.get("stock"));

  // Process variants
  const variantsCount = Number(form.get("variants_count"));
  const maxPos = await getMaxProductPosition();

  for (let i = 0; i < variantsCount; i++) {
    const variantId = form.get(`variant_${i}_id`) as string;
    const color = form.get(`variant_${i}_color`) as string;

    const image = await resolveImage(form, `variant_${i}_image`);
    const imageHover = await resolveImage(form, `variant_${i}_imageHover`);
    const images = await resolveGalleryIndexed(form, i);

    const finalId = variantId.startsWith("new-")
      ? `p-${Date.now()}-${i}`
      : variantId;

    const slug = slugify(name, color, gender);
    const position = maxPos + 1 + i;

    await upsertProduct({
      id: finalId,
      slug,
      name,
      price,
      image,
      imageHover,
      images,
      category,
      badge,
      sizes,
      isNew,
      description,
      material,
      origin,
      color,
      fit,
      gender,
      stock,
      status,
      position,
    });
  }

  return redirect("/admin/products");
}

export default function NewProductPage() {
  return <ProductForm product={null} siblings={null} />;
}

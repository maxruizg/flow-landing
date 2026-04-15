import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { colorHex } from "~/lib/color-hex-map";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } },
);

const apply = process.argv.includes("--apply");

type LegacyRow = {
  id: string;
  slug: string;
  name: string;
  price: number | string;
  price_mxn: number | string;
  image: string;
  image_hover: string;
  images: string[];
  category: string;
  badge: string | null;
  sizes: string[];
  is_new: boolean;
  description: string;
  material: string;
  origin: string;
  color: string;
  fit: string | null;
  gender: "men" | "women" | "unisex";
  size_stock: Record<string, number>;
  status: string;
  position: number;
};

function kebab(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function stripSuffix(slug: string, color: string, gender: string): string {
  const colorSlug = kebab(color);
  const suffix = `-${colorSlug}-${gender}`;
  return slug.endsWith(suffix) ? slug.slice(0, -suffix.length) : slug;
}

function num(v: number | string): number {
  return typeof v === "number" ? v : Number(v);
}

async function main() {
  const { data: legacy, error } = await supabase
    .from("products_legacy")
    .select("*")
    .order("position");
  if (error) throw error;
  if (!legacy) throw new Error("No legacy rows");

  console.log(`Legacy rows: ${legacy.length}`);

  // Group by (name, gender).
  type Group = { key: string; name: string; gender: LegacyRow["gender"]; rows: LegacyRow[] };
  const groups = new Map<string, Group>();
  for (const r of legacy as LegacyRow[]) {
    const key = `${r.name}::${r.gender}`;
    const g = groups.get(key) ?? { key, name: r.name, gender: r.gender, rows: [] };
    g.rows.push(r);
    groups.set(key, g);
  }
  console.log(`Base products to create: ${groups.size}`);

  const productRows: Record<string, unknown>[] = [];
  const variantRows: Record<string, unknown>[] = [];
  const defaultByProduct = new Map<string, string>();
  const collisions: string[] = [];
  const productSlugs = new Set<string>();
  const skus = new Set<string>();

  for (const g of groups.values()) {
    const first = g.rows[0];
    const baseSlug = stripSuffix(first.slug, first.color, first.gender);
    const productId = `p-${baseSlug}`;
    if (productSlugs.has(baseSlug)) {
      throw new Error(`Duplicate base slug derived: ${baseSlug}`);
    }
    productSlugs.add(baseSlug);

    // Sibling collision logging
    for (const field of ["category", "material", "origin", "fit", "description"] as const) {
      const distinct = new Set(g.rows.map((r) => r[field] ?? ""));
      if (distinct.size > 1) {
        collisions.push(`${g.name} (${g.gender}) has divergent ${field}: ${[...distinct].join(" | ")}`);
      }
    }

    productRows.push({
      id: productId,
      slug: baseSlug,
      name: first.name,
      description: first.description,
      category: first.category,
      gender: first.gender,
      material: first.material,
      origin: first.origin,
      fit: first.fit,
      sizes: first.sizes,
      tags: [],
      brand: null,
      position: Math.min(...g.rows.map((r) => r.position)),
    });

    // Variants
    const sortedRows = [...g.rows].sort((a, b) => a.position - b.position);
    for (const r of sortedRows) {
      const colorSlug = kebab(r.color);
      const sku = `${baseSlug}-${colorSlug}`;
      if (skus.has(sku)) {
        throw new Error(`Duplicate SKU derived: ${sku}`);
      }
      skus.add(sku);

      const mappedStatus =
        r.status === "out_of_stock" ? "active" : r.status === "active" ? "active" : "draft";

      variantRows.push({
        id: r.id,
        product_id: productId,
        slug: r.slug,
        color_name: r.color,
        color_hex: colorHex(r.color),
        sku,
        price: num(r.price),
        price_mxn: num(r.price_mxn),
        compare_at_price: null,
        size_stock: r.size_stock,
        status: mappedStatus,
        image: r.image,
        image_hover: r.image_hover,
        images: r.images,
        badge: r.badge,
        is_new: r.is_new,
        sort_order: r.position,
      });
    }

    // Default variant: first active by sort_order (which is legacy position).
    const activeVariants = sortedRows.filter((r) => r.status === "active");
    const chosen = activeVariants[0] ?? sortedRows[0];
    defaultByProduct.set(productId, chosen.id);
  }

  console.log(`\nPrepared ${productRows.length} products + ${variantRows.length} variants`);
  if (collisions.length) {
    console.log(`\nField collisions (first row wins, logged for review):`);
    for (const c of collisions) console.log(`  ! ${c}`);
  }

  if (!apply) {
    console.log("\n[dry-run] Pass --apply to write.");
    console.log("\nSample product:", productRows[0]);
    console.log("Sample variant:", variantRows[0]);
    return;
  }

  console.log("\n[apply] Inserting products...");
  const { error: pErr } = await supabase.from("products").insert(productRows);
  if (pErr) throw new Error(`Product insert: ${pErr.message}`);

  console.log("[apply] Inserting variants...");
  const { error: vErr } = await supabase.from("product_variants").insert(variantRows);
  if (vErr) throw new Error(`Variant insert: ${vErr.message}`);

  console.log("[apply] Setting default_variant_id...");
  for (const [productId, variantId] of defaultByProduct) {
    const { error: dErr } = await supabase
      .from("products")
      .update({ default_variant_id: variantId })
      .eq("id", productId);
    if (dErr) throw new Error(`default_variant_id for ${productId}: ${dErr.message}`);
  }

  // Verification
  const { count: pc } = await supabase.from("products").select("*", { count: "exact", head: true });
  const { count: vc } = await supabase.from("product_variants").select("*", { count: "exact", head: true });
  const { count: missing } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .is("default_variant_id", null);

  console.log("\n=== Summary ===");
  console.log(`Products:     ${pc}`);
  console.log(`Variants:     ${vc}`);
  console.log(`Missing defaults: ${missing}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

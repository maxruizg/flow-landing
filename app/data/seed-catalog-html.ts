import "dotenv/config";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or key env vars.");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

const argv = process.argv.slice(2);
const apply = argv.includes("--apply");
const catalogArgIdx = argv.indexOf("--catalog");
const defaultCatalog = path.join(os.homedir(), "Documents", "Catalogo Productos FLOW.html");
const catalogPath = catalogArgIdx >= 0 ? argv[catalogArgIdx + 1] : defaultCatalog;

type Gender = "men" | "women" | "unisex";

interface ParsedProduct {
  name: string;
  gender: Gender;
  color: string;
  colorSlug: string;
  price: number;
  material: string;
  category: string;
  imageDataUri: string;
  slug: string;
}

function kebab(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function slugify(name: string, colorSlug: string, gender: Gender): string {
  return `${kebab(name)}-${colorSlug}-${gender}`;
}

function parseCatalog(html: string): ParsedProduct[] {
  const products: ParsedProduct[] = [];

  const sectionRe = /<div class="category-section">([\s\S]*?)(?=<div class="category-section">|<div class="footer|$)/g;
  let sectionMatch: RegExpExecArray | null;
  while ((sectionMatch = sectionRe.exec(html))) {
    const section = sectionMatch[1];
    const titleMatch = section.match(/<div class="category-title">[\s\S]*?<span>([^<]+)<\/span>/);
    if (!titleMatch) continue;
    const category = titleMatch[1].trim();

    const cardChunks = section.split(/<div class="product-card">/).slice(1);
    for (const card of cardChunks) {
      const nameMatch = card.match(/<div class="product-name">([^<]+)<\/div>/);
      const priceMatch = card.match(/<div class="product-price">([^<]+)<\/div>/);
      const materialMatch = card.match(/<div class="product-material">([^<]+)<\/div>/);
      const imageMatch = card.match(/<img[^>]+src="(data:image\/[^"]+)"/);
      if (!nameMatch || !priceMatch || !materialMatch || !imageMatch) {
        throw new Error(`Incomplete card in category "${category}"`);
      }
      const name = nameMatch[1].trim();

      let gender: Gender;
      if (/badge-unisex/.test(card)) gender = "unisex";
      else if (/badge-women/.test(card)) gender = "women";
      else if (/badge-men/.test(card)) gender = "men";
      else throw new Error(`Unknown gender in card: ${name}`);

      const colorMatch = card.match(/<span class="badge badge-color">([^<]+)<\/span>/);
      const color = colorMatch ? colorMatch[1].trim() : "";
      const colorSlug = color ? kebab(color) : "default";

      const priceNum = Number(priceMatch[1].replace(/[^0-9.]/g, ""));
      if (!Number.isFinite(priceNum) || priceNum <= 0) {
        throw new Error(`Bad price "${priceMatch[1]}" for ${name}`);
      }

      products.push({
        name,
        gender,
        color,
        colorSlug,
        price: priceNum,
        material: materialMatch[1].trim(),
        category,
        imageDataUri: imageMatch[1],
        slug: slugify(name, colorSlug, gender),
      });
    }
  }

  return products;
}

function dataUriToBuffer(uri: string): { buffer: Buffer; mime: string; ext: string } {
  const m = uri.match(/^data:([^;]+);base64,(.*)$/);
  if (!m) throw new Error("Invalid data URI");
  const mime = m[1];
  const buffer = Buffer.from(m[2], "base64");
  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  return { buffer, mime, ext };
}

async function uploadImage(p: ParsedProduct): Promise<string> {
  const { buffer, mime, ext } = dataUriToBuffer(p.imageDataUri);
  const storagePath = `products/${p.gender}/${p.slug}.${ext}`;
  const { error } = await supabase.storage
    .from("images")
    .upload(storagePath, buffer, { contentType: mime, upsert: false });
  if (error) {
    const msg = error.message.toLowerCase();
    const isExists = msg.includes("already exists") || msg.includes("duplicate") || msg.includes("row-level security");
    if (!isExists) throw new Error(`Upload failed for ${p.slug}: ${error.message}`);
  }
  return `${supabaseUrl}/storage/v1/object/public/images/${storagePath}`;
}

function buildRow(p: ParsedProduct, imageUrl: string) {
  return {
    id: p.slug,
    slug: p.slug,
    name: p.name,
    price: p.price,
    price_mxn: p.price,
    image: imageUrl,
    image_hover: imageUrl,
    images: [imageUrl],
    category: p.category,
    badge: null as string | null,
    sizes: [] as string[],
    is_new: false,
    description: "",
    material: p.material,
    origin: "",
    color: p.color,
    fit: null as string | null,
    gender: p.gender,
    stock: 0,
    size_stock: {},
    status: "active" as const,
  };
}

async function main() {
  console.log(`[seed-catalog-html] Reading ${catalogPath}`);
  if (!fs.existsSync(catalogPath)) {
    console.error(`Catalog file not found: ${catalogPath}`);
    process.exit(1);
  }
  const html = fs.readFileSync(catalogPath, "utf8");
  const products = parseCatalog(html);
  console.log(`[seed-catalog-html] Parsed ${products.length} products`);

  const byGender: Record<Gender, number> = { men: 0, women: 0, unisex: 0 };
  const byCategory: Record<string, number> = {};
  for (const p of products) {
    byGender[p.gender]++;
    byCategory[p.category] = (byCategory[p.category] ?? 0) + 1;
  }
  console.log("  By gender:", byGender);
  console.log("  By category:", byCategory);

  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const p of products) {
    if (seen.has(p.slug)) dupes.push(p.slug);
    seen.add(p.slug);
  }
  if (dupes.length) {
    console.error(`[seed-catalog-html] Duplicate slugs detected (ambiguous source data):`);
    for (const d of dupes) console.error(`  - ${d}`);
    process.exit(1);
  }

  console.log("\nSample rows:");
  for (const p of [products[0], products[Math.floor(products.length / 2)], products.at(-1)!]) {
    console.log(`  [${p.gender}] ${p.slug}  $${p.price}  ${p.category}  (${p.color || "no-color"})`);
  }

  if (!apply) {
    console.log("\n[dry-run] Pass --apply to upload images and upsert rows.");
    return;
  }

  const slugs = products.map((p) => p.slug);
  const { data: existing, error: selErr } = await supabase
    .from("products")
    .select("slug")
    .in("slug", slugs);
  if (selErr) throw new Error(`Pre-check select failed: ${selErr.message}`);
  const existingSet = new Set((existing ?? []).map((r) => r.slug));

  console.log(`\n[apply] Uploading ${products.length} images to Supabase Storage...`);
  const rows: ReturnType<typeof buildRow>[] = [];
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const url = await uploadImage(p);
    rows.push(buildRow(p, url));
    process.stdout.write(`\r  ${i + 1}/${products.length}`);
  }
  process.stdout.write("\n");

  console.log(`[apply] Upserting ${rows.length} rows (onConflict=slug)...`);
  const { error: upErr } = await supabase.from("products").upsert(rows, { onConflict: "slug" });
  if (upErr) throw new Error(`Upsert failed: ${upErr.message}`);

  const inserted = rows.filter((r) => !existingSet.has(r.slug)).length;
  const updated = rows.length - inserted;

  console.log("\n=== Summary ===");
  console.log(`Parsed:   ${products.length}`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Updated:  ${updated}`);
  console.log(`By gender: ${JSON.stringify(byGender)}`);
  console.log(`By category: ${JSON.stringify(byCategory)}`);

  const unisexSlugs = products.filter((p) => p.gender === "unisex").map((p) => p.slug);
  console.log(`\nUnisex products: ${unisexSlugs.length}`);
  const { data: menView } = await supabase
    .from("products")
    .select("slug")
    .in("gender", ["men", "unisex"])
    .in("slug", unisexSlugs);
  const { data: womenView } = await supabase
    .from("products")
    .select("slug")
    .in("gender", ["women", "unisex"])
    .in("slug", unisexSlugs);
  console.log(`  Visible under Men's filter (gender IN men,unisex):   ${menView?.length ?? 0}/${unisexSlugs.length}`);
  console.log(`  Visible under Women's filter (gender IN women,unisex): ${womenView?.length ?? 0}/${unisexSlugs.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

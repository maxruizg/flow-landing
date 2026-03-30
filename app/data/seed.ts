import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { collections, bestSellers, newArrivals, dailyFlowImages } from "./mock.ts";
import { adminOrders, adminCustomers, adminNotifications } from "./admin-mock.ts";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const uploadImages = process.argv.includes("--upload-images");

function slugify(name: string, color: string, gender: string): string {
  return `${name}-${color}-${gender}`.toLowerCase().replace(/\s+/g, "-");
}

function deriveStock(index: number): { stock: number; status: "active" | "draft" | "out_of_stock" } {
  const stocks = [45, 0, 12, 78, 33, 5, 60, 22, 0, 90, 150, 8, 30, 15, 42, 3, 55, 20];
  const stock = stocks[index % stocks.length];
  if (stock === 0) return { stock, status: "out_of_stock" };
  if (index === 14) return { stock, status: "draft" };
  return { stock, status: "active" };
}

function mimeFromExt(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

/** Map a local `/images/...` path to a deterministic storage path inside the `images` bucket. */
function toStoragePath(localPath: string): string {
  // Remove leading `/images/`
  const rel = localPath.replace(/^\/images\//, "");
  // editorial/collection-* → collections/collection-*
  if (rel.startsWith("editorial/collection-")) {
    return `collections/${rel.replace("editorial/", "")}`;
  }
  // editorial/editorial-* → editorial/editorial-*
  if (rel.startsWith("editorial/")) {
    return rel; // already editorial/…
  }
  // menswear/* and womenswear/* → products/menswear/* and products/womenswear/*
  return `products/${rel}`;
}

function toPublicUrl(storagePath: string): string {
  return `${supabaseUrl}/storage/v1/object/public/images/${storagePath}`;
}

/** Collect every unique local image path from mock data. */
function collectLocalPaths(): Set<string> {
  const paths = new Set<string>();
  const allProducts = [...bestSellers, ...newArrivals];
  for (const p of allProducts) {
    paths.add(p.image);
    paths.add(p.imageHover);
  }
  for (const c of collections) {
    paths.add(c.image);
  }
  for (const e of dailyFlowImages) {
    paths.add(e.src);
  }
  return paths;
}

/** Upload images to Supabase Storage in batches, return map of local path → public URL. */
async function uploadAllImages(): Promise<Map<string, string>> {
  const localPaths = collectLocalPaths();
  const urlMap = new Map<string, string>();
  const publicDir = path.resolve(process.cwd(), "public");

  console.log(`Uploading ${localPaths.size} unique images to Supabase Storage...\n`);

  const entries = [...localPaths];
  const BATCH = 10;

  for (let i = 0; i < entries.length; i += BATCH) {
    const batch = entries.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(async (localPath) => {
        const storagePath = toStoragePath(localPath);
        const filePath = path.join(publicDir, localPath);
        try {
          const fileBuffer = fs.readFileSync(filePath);
          const { error } = await supabase.storage
            .from("images")
            .upload(storagePath, fileBuffer, {
              contentType: mimeFromExt(localPath),
              upsert: true,
            });
          if (error) {
            console.warn(`  ⚠ Upload failed for ${localPath}: ${error.message} — using fallback`);
            return [localPath, localPath] as const;
          }
          const publicUrl = toPublicUrl(storagePath);
          return [localPath, publicUrl] as const;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn(`  ⚠ Could not read ${filePath}: ${msg} — using fallback`);
          return [localPath, localPath] as const;
        }
      }),
    );
    for (const [local, url] of results) {
      urlMap.set(local, url);
    }
    console.log(`  Batch ${Math.floor(i / BATCH) + 1}/${Math.ceil(entries.length / BATCH)} done`);
  }

  console.log("  Upload complete.\n");
  return urlMap;
}

/** Build URL map deterministically (no uploads). */
function buildDeterministicUrlMap(): Map<string, string> {
  const localPaths = collectLocalPaths();
  const urlMap = new Map<string, string>();
  for (const localPath of localPaths) {
    urlMap.set(localPath, toPublicUrl(toStoragePath(localPath)));
  }
  return urlMap;
}

function rewrite(urlMap: Map<string, string>, localPath: string): string {
  return urlMap.get(localPath) ?? localPath;
}

async function seed() {
  console.log("Seeding database...\n");

  // Build URL map: either upload or deterministic
  const urlMap = uploadImages ? await uploadAllImages() : buildDeterministicUrlMap();

  // Combine all products (bestSellers + newArrivals, deduplicated by id)
  const seenIds = new Set<string>();
  const allProducts = [...bestSellers, ...newArrivals].filter((p) => {
    if (seenIds.has(p.id)) return false;
    seenIds.add(p.id);
    return true;
  });

  // 1. Products
  console.log(`Inserting ${allProducts.length} products...`);
  const productRows = allProducts.map((p, i) => {
    const { stock, status } = deriveStock(i);
    const slug = slugify(p.name, p.color, p.gender);
    const img = rewrite(urlMap, p.image);
    const imgHover = rewrite(urlMap, p.imageHover);
    const images = img === imgHover ? [img] : [img, imgHover];
    return {
      id: p.id,
      slug,
      name: p.name,
      price: p.price,
      image: img,
      image_hover: imgHover,
      images,
      category: p.category,
      badge: p.badge || null,
      sizes: p.sizes,
      is_new: p.isNew || false,
      description: p.description,
      material: p.material,
      origin: p.origin,
      color: p.color,
      fit: null,
      gender: p.gender,
      stock,
      status,
    };
  });
  const { error: prodErr } = await supabase.from("products").upsert(productRows);
  if (prodErr) throw prodErr;
  console.log("  Done.\n");

  // 2. Collections
  console.log(`Inserting ${collections.length} collections...`);
  const collectionRows = collections.map((c) => ({
    id: c.id,
    name: c.name,
    season: c.season,
    description: c.description,
    image: rewrite(urlMap, c.image),
    tags: c.tags,
  }));
  const { error: collErr } = await supabase.from("collections").upsert(collectionRows);
  if (collErr) throw collErr;
  console.log("  Done.\n");

  // 3. Daily Flow images
  console.log(`Inserting ${dailyFlowImages.length} daily flow images...`);
  const editRows = dailyFlowImages.map((e) => ({
    id: e.id,
    src: rewrite(urlMap, e.src),
    alt: e.alt,
    caption: e.caption,
  }));
  const { error: editErr } = await supabase.from("editorial_images").upsert(editRows);
  if (editErr) throw editErr;
  console.log("  Done.\n");

  // 4. Customers
  console.log(`Inserting ${adminCustomers.length} customers...`);
  const customerRows = adminCustomers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    total_orders: c.totalOrders,
    total_spent: c.totalSpent,
    joined_date: c.joinedDate,
    last_order_date: c.lastOrderDate,
  }));
  const { error: custErr } = await supabase.from("customers").upsert(customerRows);
  if (custErr) throw custErr;
  console.log("  Done.\n");

  // 5. Orders
  console.log(`Inserting ${adminOrders.length} orders...`);
  const orderRows = adminOrders.map((o) => ({
    id: o.id,
    customer_name: o.customerName,
    customer_email: o.customerEmail,
    date: o.date,
    items: o.items,
    total: o.total,
    status: o.status,
    shipping_address: o.shippingAddress,
  }));
  const { error: ordErr } = await supabase.from("orders").upsert(orderRows);
  if (ordErr) throw ordErr;
  console.log("  Done.\n");

  // 6. Notifications
  console.log(`Inserting ${adminNotifications.length} notifications...`);
  const notifRows = adminNotifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    date: n.date,
    read: n.read,
    link_to: n.linkTo || null,
  }));
  const { error: notifErr } = await supabase.from("notifications").upsert(notifRows);
  if (notifErr) throw notifErr;
  console.log("  Done.\n");

  console.log(`Seed complete! (images: ${uploadImages ? "uploaded" : "deterministic URLs"})`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { collections, bestSellers, newArrivals, editorialImages } from "./mock.ts";
import { adminOrders, adminCustomers, adminNotifications } from "./admin-mock.ts";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

async function seed() {
  console.log("Seeding database...\n");

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
    const images = p.image === p.imageHover ? [p.image] : [p.image, p.imageHover];
    return {
      id: p.id,
      slug,
      name: p.name,
      price: p.price,
      image: p.image,
      image_hover: p.imageHover,
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
    image: c.image,
    tags: c.tags,
  }));
  const { error: collErr } = await supabase.from("collections").upsert(collectionRows);
  if (collErr) throw collErr;
  console.log("  Done.\n");

  // 3. Editorial images
  console.log(`Inserting ${editorialImages.length} editorial images...`);
  const editRows = editorialImages.map((e) => ({
    id: e.id,
    src: e.src,
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

  console.log("Seed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

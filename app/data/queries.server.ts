import { supabase } from "~/lib/supabase.server";
import type {
  Product,
  Collection,
  DailyFlowImage,
  AdminProduct,
  AdminOrder,
  AdminCustomer,
  AdminNotification,
  DashboardStats,
  RevenueDataPoint,
} from "~/lib/types";

// ─── Helpers ──────────────────────────────────────────────

function mapProduct(row: any): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: row.price,
    image: row.image,
    imageHover: row.image_hover,
    images: row.images,
    category: row.category,
    badge: row.badge ?? undefined,
    sizes: row.sizes,
    sizeStock: row.size_stock || {},
    isNew: row.is_new ?? undefined,
    description: row.description,
    material: row.material,
    origin: row.origin,
    color: row.color,
    fit: row.fit ?? undefined,
    gender: row.gender,
  };
}

function attachColorVariants(products: Product[]): Product[] {
  const byKey = new Map<string, Product[]>();
  for (const p of products) {
    const key = `${p.name}::${p.gender}`;
    const group = byKey.get(key) || [];
    group.push(p);
    byKey.set(key, group);
  }
  for (const p of products) {
    const key = `${p.name}::${p.gender}`;
    const siblings = byKey.get(key)!;
    if (siblings.length >= 1) {
      const seen = new Set<string>();
      p.colorVariants = siblings
        .filter((s) => {
          const lower = s.color.toLowerCase();
          if (seen.has(lower)) return false;
          seen.add(lower);
          return true;
        })
        .map((s) => ({ color: s.color, slug: s.slug }));
    }
  }
  return products;
}

function mapAdminProduct(row: any): AdminProduct {
  return {
    ...mapProduct(row),
    stock: row.stock,
    status: row.status,
    position: row.position ?? 0,
  };
}

function mapCollection(row: any): Collection {
  return {
    id: row.id,
    name: row.name,
    season: row.season,
    description: row.description,
    image: row.image,
    tags: row.tags,
  };
}

function mapDailyFlowImage(row: any): DailyFlowImage {
  return {
    id: row.id,
    src: row.src,
    alt: row.alt,
    caption: row.caption,
  };
}

function mapOrder(row: any): AdminOrder {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    date: row.date,
    items: row.items,
    total: row.total,
    status: row.status,
    shippingAddress: row.shipping_address,
  };
}

function mapCustomer(row: any): AdminCustomer {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    totalOrders: row.total_orders,
    totalSpent: row.total_spent,
    joinedDate: row.joined_date,
    lastOrderDate: row.last_order_date,
  };
}

function mapNotification(row: any): AdminNotification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    date: row.date,
    read: row.read,
    linkTo: row.link_to ?? undefined,
  };
}

// ─── Public queries ──────────────────────────────────────

export async function getAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("id");
  if (error) throw error;
  return attachColorVariants(data.map(mapProduct));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) return null;

  const product = mapProduct(data);

  // Get color variants (siblings with same name + gender)
  const { data: siblings } = await supabase
    .from("products")
    .select("slug, color")
    .eq("name", product.name)
    .eq("gender", product.gender);

  if (siblings && siblings.length >= 1) {
    const seen = new Set<string>();
    product.colorVariants = siblings
      .filter((s: any) => {
        const lower = s.color.toLowerCase();
        if (seen.has(lower)) return false;
        seen.add(lower);
        return true;
      })
      .map((s: any) => ({ color: s.color, slug: s.slug }));
  }

  return product;
}

export async function getBestSellers(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_new", false)
    .order("id");
  if (error) throw error;
  return attachColorVariants(data.map(mapProduct));
}

export async function getNewArrivals(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_new", true);
  if (error) throw error;
  return attachColorVariants(data.map(mapProduct));
}

export async function getCollections(): Promise<Collection[]> {
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .order("id");
  if (error) throw error;
  return data.map(mapCollection);
}

export async function getDailyFlowImages(): Promise<DailyFlowImage[]> {
  const { data, error } = await supabase
    .from("editorial_images")
    .select("*")
    .order("id");
  if (error) throw error;
  return data.map(mapDailyFlowImage);
}

export async function getTrendingProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("badge", "Best Seller")
    .limit(3);
  if (error) throw error;
  return data.map(mapProduct);
}

// ─── Admin queries ──────────────────────────────────────

export async function getAdminProducts(): Promise<AdminProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("id");
  if (error) throw error;
  return attachColorVariants(data.map(mapAdminProduct)) as AdminProduct[];
}

export async function getAdminOrders(): Promise<AdminOrder[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  return data.map(mapOrder);
}

export async function getAdminCustomers(): Promise<AdminCustomer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("last_order_date", { ascending: false });
  if (error) throw error;
  return data.map(mapCustomer);
}

export async function getAdminNotifications(): Promise<AdminNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  return data.map(mapNotification);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    { count: totalProducts },
    { count: totalCustomers },
    { data: orders },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("customers").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("total, date, status"),
  ]);

  const allOrders = orders || [];
  const totalRevenue = allOrders
    .filter((o: any) => o.status !== "cancelled")
    .reduce((sum: number, o: any) => sum + o.total, 0);

  const today = new Date().toISOString().slice(0, 10);
  const ordersToday = allOrders.filter((o: any) => o.date === today).length;

  return {
    totalRevenue,
    ordersToday,
    totalProducts: totalProducts || 0,
    totalCustomers: totalCustomers || 0,
    revenueChange: 12.5,
    ordersChange: -3.2,
  };
}

export async function getRevenueData(): Promise<RevenueDataPoint[]> {
  const { data: orders, error } = await supabase
    .from("orders")
    .select("total, date, status")
    .neq("status", "cancelled")
    .order("date");
  if (error) throw error;

  const monthMap = new Map<string, number>();
  for (const o of orders) {
    const d = new Date(o.date);
    const key = d.toLocaleString("en-US", { month: "short" });
    monthMap.set(key, (monthMap.get(key) || 0) + o.total);
  }

  return Array.from(monthMap.entries()).map(([month, revenue]) => ({
    month,
    revenue,
  }));
}

export async function getProductSiblingsByName(name: string, gender: string): Promise<AdminProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("name", name)
    .eq("gender", gender)
    .order("id");
  if (error) throw error;
  return data.map(mapAdminProduct);
}

export async function getAdminProductById(id: string): Promise<AdminProduct | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return mapAdminProduct(data);
}

// ─── Admin mutations ──────────────────────────────────────

export async function upsertProduct(product: Record<string, any>) {
  const row = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    image: product.image,
    image_hover: product.imageHover,
    images: product.images,
    category: product.category,
    badge: product.badge || null,
    sizes: product.sizes,
    size_stock: product.sizeStock || {},
    is_new: product.isNew || false,
    description: product.description,
    material: product.material,
    origin: product.origin,
    color: product.color,
    fit: product.fit || null,
    gender: product.gender,
    stock: Object.values(product.sizeStock as Record<string, number> || {}).reduce((a: number, b: number) => a + b, 0),
    status: product.status,
    ...(product.position !== undefined && { position: product.position }),
  };
  const { error } = await supabase.from("products").upsert(row);
  if (error) throw error;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id);
  if (error) throw error;
}

export async function markAllNotificationsRead() {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("read", false);
  if (error) throw error;
}

// ─── Content mutations ──────────────────────────────────────

export async function updateCollectionImage(id: string, imageUrl: string) {
  const { error } = await supabase
    .from("collections")
    .update({ image: imageUrl })
    .eq("id", id);
  if (error) throw error;
}

export async function updateDailyFlowImage(id: string, srcUrl: string) {
  const { error } = await supabase
    .from("editorial_images")
    .update({ src: srcUrl })
    .eq("id", id);
  if (error) throw error;
}

export async function updateProductPositions(
  positions: { id: string; position: number }[]
) {
  for (const { id, position } of positions) {
    const { error } = await supabase
      .from("products")
      .update({ position })
      .eq("id", id);
    if (error) throw error;
  }
}

export async function getMaxProductPosition(): Promise<number> {
  const { data, error } = await supabase
    .from("products")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .single();
  if (error || !data) return 0;
  return data.position;
}

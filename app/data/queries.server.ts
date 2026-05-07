import { supabase } from "~/lib/supabase.server";
import type {
  Product,
  ProductVariant,
  Collection,
  DailyFlowImage,
  AdminProduct,
  AdminOrder,
  AdminCustomer,
  AdminNotification,
  Banner,
  Subscriber,
  DashboardStats,
  RevenueDataPoint,
} from "~/lib/types";

// ─── Helpers ──────────────────────────────────────────────

function mapVariant(row: any): ProductVariant {
  return {
    id: row.id,
    slug: row.slug,
    productId: row.product_id,
    colorName: row.color_name,
    colorHex: row.color_hex ?? null,
    sku: row.sku,
    price: Number(row.price),
    priceMxn: Number(row.price_mxn ?? 0),
    compareAtPrice:
      row.compare_at_price !== null && row.compare_at_price !== undefined
        ? Number(row.compare_at_price)
        : null,
    sizeStock: typeof row.size_stock === "string"
      ? JSON.parse(row.size_stock || "{}")
      : (row.size_stock ?? {}),
    stock: row.stock ?? 0,
    status: row.status,
    image: row.image,
    imageHover: row.image_hover ?? "",
    images: row.images ?? [],
    badge: row.badge ?? null,
    isNew: !!row.is_new,
    sortOrder: row.sort_order ?? 0,
    description: row.description ?? "",
  };
}

function pickDefaultVariant(
  variants: ProductVariant[],
  defaultVariantId: string | null,
): ProductVariant | undefined {
  if (defaultVariantId) {
    const byId = variants.find((v) => v.id === defaultVariantId);
    if (byId) return byId;
  }
  const activeSorted = variants
    .filter((v) => v.status === "active")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return activeSorted[0] ?? variants[0];
}

/** Build a Product with `variants` attached and legacy-shaped fields derived
 *  from the default (or first active) variant. PR 2 replaces consumers that
 *  read the legacy fields with direct `variants` access. */
function hydrateProduct(productRow: any, variantRows: any[]): Product {
  const variants = variantRows.map(mapVariant).sort((a, b) => a.sortOrder - b.sortOrder);
  const dflt = pickDefaultVariant(variants, productRow.default_variant_id ?? null);
  const colorVariants = variants
    .filter((v) => v.status === "active")
    .map((v) => ({ color: v.colorName, slug: v.slug }));
  return {
    id: productRow.id,
    slug: productRow.slug,
    name: productRow.name,
    category: productRow.category,
    gender: productRow.gender,
    material: productRow.material ?? "",
    origin: productRow.origin ?? "",
    fit: productRow.fit ?? undefined,
    sizes: productRow.sizes ?? [],
    tags: productRow.tags ?? [],
    brand: productRow.brand ?? undefined,
    defaultVariantId: productRow.default_variant_id ?? null,
    variants,
    position: productRow.position ?? 0,
    newArrivalsPosition: productRow.new_arrivals_position ?? 0,

    // Legacy-shaped derived fields (PR 1 compat).
    price: dflt?.price ?? 0,
    priceMxn: dflt?.priceMxn ?? 0,
    image: dflt?.image ?? "",
    imageHover: dflt?.imageHover ?? "",
    images: dflt?.images ?? [],
    badge: dflt?.badge ?? undefined,
    isNew: dflt?.isNew ?? false,
    color: dflt?.colorName ?? "",
    sizeStock: dflt?.sizeStock ?? {},
    colorVariants,
  };
}

async function fetchProductsWithVariants(productIds?: string[]): Promise<Product[]> {
  let q = supabase.from("products").select("*").order("position");
  if (productIds) q = q.in("id", productIds);
  const { data: productRows, error: pErr } = await q;
  if (pErr) throw pErr;
  if (!productRows || productRows.length === 0) return [];

  const ids = productRows.map((p) => p.id);
  const { data: variantRows, error: vErr } = await supabase
    .from("product_variants")
    .select("*")
    .in("product_id", ids);
  if (vErr) throw vErr;

  const byProduct = new Map<string, any[]>();
  for (const v of variantRows ?? []) {
    const arr = byProduct.get(v.product_id) ?? [];
    arr.push(v);
    byProduct.set(v.product_id, arr);
  }

  return productRows.map((p) => hydrateProduct(p, byProduct.get(p.id) ?? []));
}

function visibleForShop(p: Product): boolean {
  return p.variants.some((v) => v.status === "active");
}

function toAdminProduct(p: Product): AdminProduct {
  const totalStock = p.variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
  const anyDraft = p.variants.some((v) => v.status === "draft");
  const noActive = !p.variants.some((v) => v.status === "active");
  const status: AdminProduct["status"] = noActive
    ? "draft"
    : totalStock === 0
      ? "out_of_stock"
      : anyDraft
        ? "draft"
        : "active";
  return { ...p, stock: totalStock, status };
}

function mapCollection(row: any): Collection {
  return {
    id: row.id,
    name: row.name,
    season: row.season,
    description: row.description,
    image: row.image,
    video: row.video ?? undefined,
    tags: row.tags,
  };
}

function mapDailyFlowImage(row: any): DailyFlowImage {
  return {
    id: row.id,
    src: row.src,
    alt: row.alt,
    caption: row.caption,
    video: row.video ?? undefined,
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
  const products = await fetchProductsWithVariants();
  return products.filter(visibleForShop);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data: base } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!base) return null;

  const { data: variantRows } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", base.id);
  const product = hydrateProduct(base, variantRows ?? []);
  return visibleForShop(product) ? product : null;
}

/** Resolve a slug whose only difference is a swapped gender suffix
 *  (e.g. inbound `flow-jumpsuit-unisex` → DB has `flow-jumpsuit-women`).
 *  Lets the PDP loader 301-redirect after an admin edits a product's gender. */
export async function findProductBySlugSuffixSwap(
  slug: string,
): Promise<Product | null> {
  const genders = ["men", "women", "unisex"] as const;
  const matched = genders.find((g) => slug.endsWith(`-${g}`));
  if (!matched) return null;
  const stem = slug.slice(0, slug.length - matched.length - 1);
  if (!stem) return null;
  for (const g of genders) {
    if (g === matched) continue;
    const found = await getProductBySlug(`${stem}-${g}`);
    if (found) return found;
  }
  return null;
}

/** Look up a legacy per-color slug. Returns the new base slug + the matching
 *  variant id so the PDP loader can 301-redirect. */
export async function findProductByVariantSlug(
  slug: string,
): Promise<{ productSlug: string; variantId: string } | null> {
  const { data: variant } = await supabase
    .from("product_variants")
    .select("id, product_id")
    .eq("slug", slug)
    .maybeSingle();
  if (!variant) return null;
  const { data: parent } = await supabase
    .from("products")
    .select("slug")
    .eq("id", variant.product_id)
    .maybeSingle();
  if (!parent) return null;
  return { productSlug: parent.slug, variantId: variant.id };
}

export async function getBestSellers(): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter((p) => p.variants.some((v) => v.badge === "Best Seller"));
}

export async function getNewArrivals(): Promise<Product[]> {
  const all = await getAllProducts();
  return all
    .filter((p) => p.variants.some((v) => v.isNew))
    .sort((a, b) => a.newArrivalsPosition - b.newArrivalsPosition);
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

/**
 * Fetch the products that have at least one variant flagged "Best Seller",
 * limited to a small N. Avoids pulling the full catalog when only a couple
 * of cards are needed (root loader trending strip).
 */
export async function getTrendingProducts(limit = 3): Promise<Product[]> {
  const { data: bestSellerVariants, error: vErr } = await supabase
    .from("product_variants")
    .select("product_id")
    .eq("badge", "Best Seller")
    .eq("status", "active");
  if (vErr) throw vErr;
  const productIds = Array.from(
    new Set((bestSellerVariants ?? []).map((v: any) => v.product_id)),
  ).slice(0, limit);
  if (productIds.length === 0) return [];
  const products = await fetchProductsWithVariants(productIds);
  return products.filter(visibleForShop).slice(0, limit);
}

/**
 * Single round-trip for everything the homepage renders. Fetches the full
 * shoppable catalog once, then derives bestSellers / newArrivals in-memory.
 * Replaces three separate getAllProducts() calls (saves ~4 Supabase queries
 * per home view).
 */
export async function getHomePageData(): Promise<{
  collections: Collection[];
  bestSellers: Product[];
  dailyFlowImages: DailyFlowImage[];
  newArrivals: Product[];
}> {
  const [collections, dailyFlowImages, allProducts] = await Promise.all([
    getCollections(),
    getDailyFlowImages(),
    getAllProducts(),
  ]);
  const bestSellers = allProducts.filter((p) =>
    p.variants.some((v) => v.badge === "Best Seller"),
  );
  const newArrivals = allProducts
    .filter((p) => p.variants.some((v) => v.isNew))
    .sort((a, b) => a.newArrivalsPosition - b.newArrivalsPosition);
  return { collections, bestSellers, dailyFlowImages, newArrivals };
}

// ─── Admin queries ──────────────────────────────────────

export async function getAdminProducts(): Promise<AdminProduct[]> {
  const products = await fetchProductsWithVariants();
  return products.map(toAdminProduct);
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

export async function createOrder(order: {
  id: string;
  customerName: string;
  customerEmail: string;
  items: {
    productName: string;
    colorName?: string | null;
    size: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  currency: string;
  shippingAddress: string;
  stripeSessionId: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("orders").insert({
    id: order.id,
    customer_name: order.customerName,
    customer_email: order.customerEmail,
    date: today,
    items: order.items,
    total: order.total,
    currency: order.currency,
    status: "processing",
    shipping_address: order.shippingAddress,
    stripe_session_id: order.stripeSessionId,
  });
  if (error) throw error;
}

export async function createOrUpdateCustomer(customer: {
  name: string;
  email: string;
  orderTotal: number;
}): Promise<{ isNew: boolean }> {
  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await supabase
    .from("customers")
    .select("id, total_orders, total_spent")
    .eq("email", customer.email)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("customers")
      .update({
        name: customer.name,
        total_orders: existing.total_orders + 1,
        total_spent: existing.total_spent + customer.orderTotal,
        last_order_date: today,
      })
      .eq("id", existing.id);
    if (error) throw error;
    return { isNew: false };
  }

  const { error } = await supabase.from("customers").insert({
    id: crypto.randomUUID(),
    name: customer.name,
    email: customer.email,
    total_orders: 1,
    total_spent: customer.orderTotal,
    joined_date: today,
    last_order_date: today,
  });
  if (error) throw error;
  return { isNew: true };
}

export async function getOrderByStripeSession(sessionId: string): Promise<AdminOrder | null> {
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();
  return data ? mapOrder(data) : null;
}

export async function getAdminNotifications(): Promise<AdminNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  return data.map(mapNotification);
}

export async function getUnreadNotificationCount(): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("read", false);
  if (error) {
    console.error("[notifications] getUnreadNotificationCount failed:", error);
    return 0;
  }
  return count ?? 0;
}

/** Fire-and-forget notification insert. Failures are logged, never thrown —
 *  notifications are a side-channel, they must not break the caller's flow. */
export async function createNotification(n: {
  type: AdminNotification["type"];
  title: string;
  message?: string;
  linkTo?: string | null;
}): Promise<void> {
  const { error } = await supabase.from("notifications").insert({
    id: crypto.randomUUID(),
    type: n.type,
    title: n.title,
    message: n.message ?? "",
    date: new Date().toISOString(),
    read: false,
    link_to: n.linkTo ?? null,
  });
  if (error) console.error("[notifications] createNotification failed:", error);
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
  const validOrders = allOrders.filter((o: any) => o.status !== "cancelled");
  const totalRevenue = validOrders.reduce((sum: number, o: any) => sum + o.total, 0);

  const today = new Date().toISOString().slice(0, 10);
  const ordersToday = allOrders.filter((o: any) => o.date === today).length;

  // Calculate month-over-month changes from real data
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  let thisMonthRevenue = 0;
  let prevMonthRevenue = 0;
  let thisMonthOrders = 0;
  let prevMonthOrders = 0;

  for (const o of validOrders) {
    const orderMonth = (o.date as string).slice(0, 7);
    if (orderMonth === thisMonth) {
      thisMonthRevenue += o.total;
      thisMonthOrders++;
    } else if (orderMonth === prevMonth) {
      prevMonthRevenue += o.total;
      prevMonthOrders++;
    }
  }

  const revenueChange = prevMonthRevenue > 0
    ? ((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
    : 0;
  const ordersChange = prevMonthOrders > 0
    ? ((thisMonthOrders - prevMonthOrders) / prevMonthOrders) * 100
    : 0;

  return {
    totalRevenue,
    ordersToday,
    totalProducts: totalProducts || 0,
    totalCustomers: totalCustomers || 0,
    revenueChange: Math.round(revenueChange * 10) / 10,
    ordersChange: Math.round(ordersChange * 10) / 10,
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
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("name", name)
    .eq("gender", gender);
  if (!products || products.length === 0) return [];
  const productIds = products.map((p) => p.id);
  const { data: variantRows } = await supabase
    .from("product_variants")
    .select("*")
    .in("product_id", productIds);
  const byProduct = new Map<string, any[]>();
  for (const v of variantRows ?? []) {
    const arr = byProduct.get(v.product_id) ?? [];
    arr.push(v);
    byProduct.set(v.product_id, arr);
  }
  return products.map((p) => toAdminProduct(hydrateProduct(p, byProduct.get(p.id) ?? [])));
}

export async function getAdminProductById(id: string): Promise<AdminProduct | null> {
  // `id` can be either a base product id or (legacy) a variant id.
  let baseRow: any | null = null;
  const byBase = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (byBase.data) {
    baseRow = byBase.data;
  } else {
    const byVariant = await supabase
      .from("product_variants")
      .select("product_id")
      .eq("id", id)
      .maybeSingle();
    if (byVariant.data) {
      const parent = await supabase
        .from("products")
        .select("*")
        .eq("id", byVariant.data.product_id)
        .maybeSingle();
      baseRow = parent.data;
    }
  }
  if (!baseRow) return null;
  const { data: variantRows } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", baseRow.id);
  return toAdminProduct(hydrateProduct(baseRow, variantRows ?? []));
}

// ─── Admin mutations ──────────────────────────────────────

export interface BaseProductInput {
  id: string;
  slug: string;
  name: string;
  category: string;
  gender: "men" | "women" | "unisex";
  material: string;
  origin: string;
  fit: string | null;
  sizes: string[];
  tags?: string[];
  brand?: string | null;
  position?: number;
}

export interface VariantInput {
  id: string;
  productId: string;
  slug: string;
  colorName: string;
  colorHex: string | null;
  sku: string;
  price: number;
  priceMxn: number;
  compareAtPrice: number | null;
  sizeStock: Record<string, number>;
  status: "active" | "draft" | "archived";
  image: string;
  imageHover: string;
  images: string[];
  badge: string | null;
  isNew: boolean;
  sortOrder: number;
  description: string;
}

export async function upsertBaseProduct(p: BaseProductInput): Promise<void> {
  const row: Record<string, any> = {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    gender: p.gender,
    material: p.material,
    origin: p.origin,
    fit: p.fit,
    sizes: p.sizes,
    tags: p.tags ?? [],
    brand: p.brand ?? null,
    updated_at: new Date().toISOString(),
  };
  if (p.position !== undefined) row.position = p.position;
  const { error } = await supabase.from("products").upsert(row);
  if (error) throw error;
}

export async function upsertVariants(variants: VariantInput[]): Promise<void> {
  if (variants.length === 0) return;
  const rows = variants.map((v) => ({
    id: v.id,
    product_id: v.productId,
    slug: v.slug,
    color_name: v.colorName,
    color_hex: v.colorHex,
    sku: v.sku,
    price: v.price,
    price_mxn: v.priceMxn,
    compare_at_price: v.compareAtPrice,
    size_stock: v.sizeStock,
    status: v.status,
    image: v.image,
    image_hover: v.imageHover,
    images: v.images,
    badge: v.badge,
    is_new: v.isNew,
    sort_order: v.sortOrder,
    description: v.description,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from("product_variants").upsert(rows);
  if (error) throw error;
}

export async function deleteVariants(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase.from("product_variants").delete().in("id", ids);
  if (error) throw error;
}

/** Decrement per-size stock on a variant after an order is paid. If a requested
 *  size has less stock than ordered, it clamps to 0 (defensive — webhook runs
 *  after payment, so we accept the sale and log the shortfall). */
export async function decrementVariantStock(
  variantId: string,
  size: string,
  qty: number,
): Promise<{ nextStock: number } | null> {
  const { data, error } = await supabase
    .from("product_variants")
    .select("size_stock")
    .eq("id", variantId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const current = (data.size_stock ?? {}) as Record<string, number>;
  const nextStock = Math.max(0, (current[size] ?? 0) - qty);
  const next = { ...current, [size]: nextStock };
  const { error: uErr } = await supabase
    .from("product_variants")
    .update({ size_stock: next })
    .eq("id", variantId);
  if (uErr) throw uErr;
  return { nextStock };
}

export async function setDefaultVariant(productId: string, variantId: string | null): Promise<void> {
  const { error } = await supabase
    .from("products")
    .update({ default_variant_id: variantId })
    .eq("id", productId);
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

export async function updateCollectionVideo(id: string, videoUrl: string | null) {
  const { error } = await supabase
    .from("collections")
    .update({ video: videoUrl })
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

export async function updateDailyFlowVideo(id: string, videoUrl: string | null) {
  const { error } = await supabase
    .from("editorial_images")
    .update({ video: videoUrl })
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

export async function updateNewArrivalsPositions(
  positions: { id: string; position: number }[]
) {
  for (const { id, position } of positions) {
    const { error } = await supabase
      .from("products")
      .update({ new_arrivals_position: position })
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

// ─── Subscriber queries ──────────────────────────────────────

export async function addSubscriber(email: string): Promise<{ success: boolean; error?: string }> {
  const id = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const { error } = await supabase
    .from("subscribers")
    .upsert({ id, email, active: true }, { onConflict: "email" });
  if (error) {
    if (error.code === "23505") return { success: true }; // already subscribed
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function getActiveSubscribers(): Promise<Subscriber[]> {
  const { data, error } = await supabase
    .from("subscribers")
    .select("*")
    .eq("active", true)
    .order("subscribed_at", { ascending: false });
  if (error) throw error;
  return data.map((row: any) => ({
    id: row.id,
    email: row.email,
    subscribedAt: row.subscribed_at,
    active: row.active,
  }));
}

export async function getSubscriberCount(): Promise<number> {
  const { count, error } = await supabase
    .from("subscribers")
    .select("*", { count: "exact", head: true })
    .eq("active", true);
  if (error) throw error;
  return count || 0;
}

// ─── Banner queries ──────────────────────────────────────

function mapBanner(row: any): Banner {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    active: row.active,
    startDate: row.start_date,
    endDate: row.end_date,
  };
}

export async function getActiveBanner(): Promise<Banner | null> {
  // Fetch all active banners and filter schedule in JS — avoids fragile
  // Supabase .or() chaining and handles null dates cleanly.
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });
  if (error || !data || data.length === 0) return null;

  const now = Date.now();
  const valid = data.find((row: any) => {
    if (row.start_date && new Date(row.start_date).getTime() > now) return false;
    if (row.end_date && new Date(row.end_date).getTime() < now) return false;
    return true;
  });
  return valid ? mapBanner(valid) : null;
}

export async function getBanner(): Promise<Banner | null> {
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return mapBanner(data);
}

export async function upsertBanner(banner: {
  id: string;
  title: string;
  description: string;
  active: boolean;
  startDate: string | null;
  endDate: string | null;
}) {
  const row = {
    id: banner.id,
    title: banner.title,
    description: banner.description,
    active: banner.active,
    start_date: banner.startDate || null,
    end_date: banner.endDate || null,
  };
  const { error } = await supabase.from("banners").upsert(row);
  if (error) throw error;
}

export async function deleteBanner(id: string): Promise<void> {
  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) throw error;
}

// ─── Admin Users ────────────────────────────────────────────────

export async function getAdminByEmail(email: string) {
  const { data } = await supabase
    .from("admins")
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  return data;
}

export async function getAdminById(id: string) {
  const { data } = await supabase
    .from("admins")
    .select("id, name, email")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function getAllAdmins() {
  const { data, error } = await supabase
    .from("admins")
    .select("id, name, email, created_at")
    .order("created_at");
  if (error) throw error;
  return data || [];
}

export async function createAdmin(name: string, email: string, passwordHash: string) {
  const { error } = await supabase.from("admins").insert({
    id: crypto.randomUUID(),
    name,
    email: email.toLowerCase(),
    password_hash: passwordHash,
  });
  if (error) throw error;
}

export async function deleteAdmin(id: string) {
  const { error } = await supabase.from("admins").delete().eq("id", id);
  if (error) throw error;
}

export async function updateAdminUser(id: string, updates: { name?: string; email?: string; passwordHash?: string }) {
  const row: Record<string, any> = {};
  if (updates.name) row.name = updates.name;
  if (updates.email) row.email = updates.email.toLowerCase();
  if (updates.passwordHash) row.password_hash = updates.passwordHash;
  const { error } = await supabase.from("admins").update(row).eq("id", id);
  if (error) throw error;
}

export async function getAdminCount() {
  const { count, error } = await supabase
    .from("admins")
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return count || 0;
}

// ─── Email Templates ────────────────────────────────────────────

export async function getEmailTemplates() {
  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .order("created_at");
  if (error) throw error;
  return data || [];
}

export async function getEmailTemplate(id: string) {
  const { data } = await supabase
    .from("email_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data;
}

// ─── Email Campaigns ────────────────────────────────────────────

export async function getCampaigns() {
  const { data, error } = await supabase
    .from("email_campaigns")
    .select("*, email_templates(name, component_name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getCampaign(id: string) {
  const { data } = await supabase
    .from("email_campaigns")
    .select("*, email_templates(name, component_name, variables_schema)")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function createCampaign(campaign: {
  name: string;
  subject?: string;
  preheader?: string;
  templateId: string;
  status?: string;
  scheduledAt?: string | null;
  targetTags?: string[];
}) {
  const id = `camp-${Date.now().toString(36)}`;
  const { error } = await supabase.from("email_campaigns").insert({
    id,
    name: campaign.name,
    subject: campaign.subject || "",
    preheader: campaign.preheader || "",
    template_id: campaign.templateId,
    status: campaign.status || "draft",
    scheduled_at: campaign.scheduledAt || null,
    target_tags: campaign.targetTags || [],
  });
  if (error) throw error;
  return id;
}

export async function updateCampaign(id: string, updates: Record<string, any>) {
  const row: Record<string, any> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.subject !== undefined) row.subject = updates.subject;
  if (updates.preheader !== undefined) row.preheader = updates.preheader;
  if (updates.templateId !== undefined) row.template_id = updates.templateId;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.scheduledAt !== undefined) row.scheduled_at = updates.scheduledAt;
  if (updates.sentAt !== undefined) row.sent_at = updates.sentAt;
  if (updates.targetTags !== undefined) row.target_tags = updates.targetTags;
  const { error } = await supabase.from("email_campaigns").update(row).eq("id", id);
  if (error) throw error;
}

export async function deleteCampaign(id: string) {
  const { error } = await supabase.from("email_campaigns").delete().eq("id", id);
  if (error) throw error;
}

// ─── Campaign Content ───────────────────────────────────────────

export async function getCampaignContent(campaignId: string) {
  const { data } = await supabase
    .from("campaign_content")
    .select("*")
    .eq("campaign_id", campaignId)
    .maybeSingle();
  return data;
}

export async function upsertCampaignContent(campaignId: string, variables: Record<string, any>) {
  const { data: existing } = await supabase
    .from("campaign_content")
    .select("id")
    .eq("campaign_id", campaignId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("campaign_content")
      .update({ variables })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("campaign_content").insert({
      id: `cc-${Date.now().toString(36)}`,
      campaign_id: campaignId,
      variables,
    });
    if (error) throw error;
  }
}

// ─── Campaign Images ────────────────────────────────────────────

export async function getCampaignImages(campaignId: string) {
  const { data, error } = await supabase
    .from("campaign_images")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("sort_order");
  if (error) throw error;
  return data || [];
}

export async function upsertCampaignImage(image: {
  campaignId: string;
  slotName: string;
  storageUrl: string;
  altText?: string;
  sortOrder?: number;
}) {
  const { data: existing } = await supabase
    .from("campaign_images")
    .select("id")
    .eq("campaign_id", image.campaignId)
    .eq("slot_name", image.slotName)
    .maybeSingle();

  const row = {
    campaign_id: image.campaignId,
    slot_name: image.slotName,
    storage_url: image.storageUrl,
    alt_text: image.altText || "",
    sort_order: image.sortOrder || 0,
  };

  if (existing) {
    const { error } = await supabase
      .from("campaign_images")
      .update(row)
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("campaign_images").insert({
      id: `ci-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      ...row,
    });
    if (error) throw error;
  }
}

// ─── Campaign Logs ──────────────────────────────────────────────

export async function getCampaignLog(campaignId: string) {
  const { data } = await supabase
    .from("campaign_logs")
    .select("*")
    .eq("campaign_id", campaignId)
    .maybeSingle();
  return data;
}

export async function createCampaignLog(log: {
  campaignId: string;
  totalSent: number;
  totalFailed: number;
  startedAt: string;
  finishedAt: string;
  errorDetails?: string;
}) {
  const { error } = await supabase.from("campaign_logs").insert({
    id: `cl-${Date.now().toString(36)}`,
    campaign_id: log.campaignId,
    total_sent: log.totalSent,
    total_failed: log.totalFailed,
    started_at: log.startedAt,
    finished_at: log.finishedAt,
    error_details: log.errorDetails || null,
  });
  if (error) throw error;
}

// ─── Subscribers (enhanced) ─────────────────────────────────────

export async function getSubscribersWithTags() {
  const { data, error } = await supabase
    .from("subscribers")
    .select("*")
    .order("subscribed_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getSubscribersByTags(tags: string[]) {
  if (tags.length === 0) return getActiveSubscribers();
  const { data, error } = await supabase
    .from("subscribers")
    .select("*")
    .eq("active", true)
    .overlaps("tags", tags);
  if (error) throw error;
  return data || [];
}

export async function updateSubscriber(id: string, updates: { name?: string; active?: boolean; tags?: string[] }) {
  const { error } = await supabase.from("subscribers").update(updates).eq("id", id);
  if (error) throw error;
}

export async function getEmailSettings(key: string): Promise<Record<string, any>> {
  const { data } = await supabase
    .from("email_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return (data?.value as Record<string, any>) ?? {};
}

export async function saveEmailSettings(key: string, value: Record<string, any>): Promise<void> {
  const { error } = await supabase.from("email_settings").upsert({
    key,
    value,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

// ─── Visitor Analytics ─────────────────────────────────────────

export interface VisitorAnalytics {
  // Headline metrics for KPI cards.
  today: { uniques: number; views: number; uniquesChange: number };
  week: { uniques: number; views: number; uniquesChange: number };
  month: { uniques: number; views: number; uniquesChange: number };
  allTime: { uniques: number; views: number };
  // Last 30 days, oldest → newest, one entry per calendar day.
  daily: { date: string; uniques: number; views: number }[];
}

export interface PageViewInput {
  visitorId: string;
  path: string;
  referrer?: string | null;
  userAgent?: string | null;
}

/** Fire-and-forget. Errors are logged, never thrown — analytics must never
 *  break a public page render. */
export async function recordPageView(input: PageViewInput): Promise<void> {
  const { error } = await supabase.from("page_views").insert({
    visitor_id: input.visitorId,
    path: input.path,
    referrer: input.referrer ?? null,
    user_agent: input.userAgent ?? null,
  });
  if (error) console.error("[analytics] recordPageView failed:", error.message);
}

function dayKey(d: Date): string {
  // YYYY-MM-DD in UTC.
  return d.toISOString().slice(0, 10);
}

function pctChange(current: number, prior: number): number {
  if (prior === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - prior) / prior) * 1000) / 10;
}

export async function getVisitorAnalytics(): Promise<VisitorAnalytics> {
  const now = new Date();
  // Use a 60-day window so we can compute week/month deltas vs prior period.
  const windowStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("page_views")
    .select("visitor_id, viewed_at")
    .gte("viewed_at", windowStart.toISOString())
    .order("viewed_at", { ascending: true });
  if (error) throw error;

  const rows = data ?? [];
  const startOfTodayUTC = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
  ));
  const dayMs = 24 * 60 * 60 * 1000;

  const inRange = (rowTime: number, start: Date, end: Date) =>
    rowTime >= start.getTime() && rowTime < end.getTime();

  const aggregate = (start: Date, end: Date) => {
    const uniques = new Set<string>();
    let views = 0;
    for (const r of rows) {
      const t = new Date(r.viewed_at).getTime();
      if (inRange(t, start, end)) {
        views++;
        uniques.add(r.visitor_id);
      }
    }
    return { uniques: uniques.size, views };
  };

  const todayEnd = new Date(startOfTodayUTC.getTime() + dayMs);
  const yesterdayStart = new Date(startOfTodayUTC.getTime() - dayMs);
  const weekStart = new Date(startOfTodayUTC.getTime() - 6 * dayMs);
  const weekPriorStart = new Date(startOfTodayUTC.getTime() - 13 * dayMs);
  const weekPriorEnd = new Date(startOfTodayUTC.getTime() - 6 * dayMs);
  const monthStart = new Date(startOfTodayUTC.getTime() - 29 * dayMs);
  const monthPriorStart = new Date(startOfTodayUTC.getTime() - 59 * dayMs);
  const monthPriorEnd = new Date(startOfTodayUTC.getTime() - 29 * dayMs);

  const todayAgg = aggregate(startOfTodayUTC, todayEnd);
  const yesterdayAgg = aggregate(yesterdayStart, startOfTodayUTC);
  const weekAgg = aggregate(weekStart, todayEnd);
  const weekPriorAgg = aggregate(weekPriorStart, weekPriorEnd);
  const monthAgg = aggregate(monthStart, todayEnd);
  const monthPriorAgg = aggregate(monthPriorStart, monthPriorEnd);

  // All-time: cheap counts that don't go through the 60-day window.
  const [{ count: totalViews }, { data: allUniqueRows }] = await Promise.all([
    supabase.from("page_views").select("*", { count: "exact", head: true }),
    supabase.from("page_views").select("visitor_id"),
  ]);
  const allTimeUniques = new Set((allUniqueRows ?? []).map((r: any) => r.visitor_id)).size;

  // Build a 30-day daily series from the windowed rows.
  const dayBuckets = new Map<string, { uniques: Set<string>; views: number }>();
  for (let i = 29; i >= 0; i--) {
    const day = new Date(startOfTodayUTC.getTime() - i * dayMs);
    dayBuckets.set(dayKey(day), { uniques: new Set(), views: 0 });
  }
  for (const r of rows) {
    const t = new Date(r.viewed_at);
    const key = dayKey(t);
    const bucket = dayBuckets.get(key);
    if (bucket) {
      bucket.views++;
      bucket.uniques.add(r.visitor_id);
    }
  }
  const daily = Array.from(dayBuckets.entries()).map(([date, b]) => ({
    date,
    uniques: b.uniques.size,
    views: b.views,
  }));

  return {
    today: {
      uniques: todayAgg.uniques,
      views: todayAgg.views,
      uniquesChange: pctChange(todayAgg.uniques, yesterdayAgg.uniques),
    },
    week: {
      uniques: weekAgg.uniques,
      views: weekAgg.views,
      uniquesChange: pctChange(weekAgg.uniques, weekPriorAgg.uniques),
    },
    month: {
      uniques: monthAgg.uniques,
      views: monthAgg.views,
      uniquesChange: pctChange(monthAgg.uniques, monthPriorAgg.uniques),
    },
    allTime: { uniques: allTimeUniques, views: totalViews ?? 0 },
    daily,
  };
}

export async function getCampaignStats() {
  const { data: campaigns } = await supabase
    .from("email_campaigns")
    .select("status");
  const { data: logs } = await supabase
    .from("campaign_logs")
    .select("total_sent");

  const totalSent = (logs || []).reduce((sum, l) => sum + (l.total_sent || 0), 0);
  const pending = (campaigns || []).filter(c => c.status === "scheduled").length;
  const total = (campaigns || []).length;

  return { totalSent, pending, total };
}

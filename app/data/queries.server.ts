import { supabase } from "~/lib/supabase.server";
import type {
  Product,
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

function mapProduct(row: any): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: row.price,
    priceMxn: row.price_mxn || 0,
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
  // Group by name only — unisex products share color variants with all genders
  const byName = new Map<string, Product[]>();
  for (const p of products) {
    const group = byName.get(p.name) || [];
    group.push(p);
    byName.set(p.name, group);
  }
  for (const p of products) {
    const siblings = byName.get(p.name)!;
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
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .order("position");
  if (error) throw error;
  return attachColorVariants(data.map(mapProduct));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();
  if (error) return null;

  const product = mapProduct(data);

  // Get color variants (siblings with same name, any gender)
  const { data: siblings } = await supabase
    .from("products")
    .select("slug, color")
    .eq("name", product.name);

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
    .eq("status", "active")
    .order("position");
  if (error) throw error;
  return attachColorVariants(data.map(mapProduct));
}

export async function getNewArrivals(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_new", true)
    .eq("status", "active")
    .order("position");
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
    .eq("status", "active")
    .limit(3);
  if (error) throw error;
  return data.map(mapProduct);
}

// ─── Admin queries ──────────────────────────────────────

export async function getAdminProducts(): Promise<AdminProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("position");
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

export async function createOrder(order: {
  id: string;
  customerName: string;
  customerEmail: string;
  items: { productName: string; size: string; quantity: number; price: number }[];
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
}) {
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
  } else {
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
  }
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
    price_mxn: product.priceMxn || 0,
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

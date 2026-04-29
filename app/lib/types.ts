export type VariantStatus = "active" | "draft" | "archived";

export interface ProductVariant {
  id: string;
  slug: string;
  productId: string;
  colorName: string;
  colorHex: string | null;
  sku: string;
  price: number;
  priceMxn: number;
  compareAtPrice: number | null;
  sizeStock: Record<string, number>;
  stock: number;
  status: VariantStatus;
  image: string;
  imageHover: string;
  images: string[];
  badge: string | null;
  isNew: boolean;
  sortOrder: number;
  description: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  gender: "men" | "women" | "unisex";
  material: string;
  origin: string;
  fit?: string;
  sizes: string[];
  tags: string[];
  brand?: string;
  defaultVariantId: string | null;
  variants: ProductVariant[];
  position: number;
  newArrivalsPosition: number;

  // Legacy-shaped fields, derived from the default (or first) variant.
  // Kept for PR 1 so existing UI renders unchanged; PR 2 migrates consumers
  // to read `variants` / the selected variant directly.
  price: number;
  priceMxn: number;
  image: string;
  imageHover: string;
  images: string[];
  badge?: string;
  isNew?: boolean;
  color: string;
  sizeStock: Record<string, number>;
  colorVariants?: { color: string; slug: string }[];
}

export interface CartItem {
  productId: string;
  variantId?: string; // optional during transition; required after PR 4
  productSlug: string;
  variantSlug?: string;
  productName: string;
  colorName?: string;
  productImage: string;
  size: string;
  price: number;
  priceMxn: number;
  quantity: number;
}

export interface Collection {
  id: string;
  name: string;
  season: string;
  description: string;
  image: string;
  video?: string;
  tags: string[];
}

export interface DailyFlowImage {
  id: string;
  src: string;
  alt: string;
  caption: string;
  video?: string;
}

export interface AdminProduct extends Product {
  stock: number;
  status: "active" | "draft" | "out_of_stock";
}

export interface OrderItem {
  productName: string;
  colorName?: string | null;
  size: string;
  quantity: number;
  price: number;
}

export interface AdminOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  date: string;
  items: OrderItem[];
  total: number;
  status: "processing" | "shipped" | "delivered" | "cancelled";
  shippingAddress: string;
}

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  joinedDate: string;
  lastOrderDate: string;
}

export interface DashboardStats {
  totalRevenue: number;
  ordersToday: number;
  totalProducts: number;
  totalCustomers: number;
  revenueChange: number;
  ordersChange: number;
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
}

export interface Banner {
  id: string;
  title: string;
  description: string;
  active: boolean;
  startDate: string | null;
  endDate: string | null;
}

export interface Subscriber {
  id: string;
  email: string;
  subscribedAt: string;
  active: boolean;
}

export interface AdminNotification {
  id: string;
  type: "order" | "stock" | "customer" | "system";
  title: string;
  message: string;
  date: string;
  read: boolean;
  linkTo?: string;
}

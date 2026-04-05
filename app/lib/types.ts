export interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  priceMxn: number;
  image: string;
  imageHover: string;
  images: string[];
  category: string;
  badge?: string;
  sizes: string[];
  sizeStock: Record<string, number>;
  isNew?: boolean;
  description: string;
  material: string;
  origin: string;
  color: string;
  fit?: string;
  gender: "men" | "women" | "unisex";
  colorVariants?: { color: string; slug: string }[];
}

export interface CartItem {
  productId: string;
  productSlug: string;
  productName: string;
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
  position: number;
}

export interface OrderItem {
  productName: string;
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

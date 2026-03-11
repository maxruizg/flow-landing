import type { Product } from "./mock";
import { bestSellers, newArrivals } from "./mock";

export interface AdminProduct extends Product {
  stock: number;
  status: "active" | "draft" | "out_of_stock";
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

function deriveStock(index: number): { stock: number; status: AdminProduct["status"] } {
  const stocks = [45, 0, 12, 78, 33, 5, 60, 22, 0, 90, 150, 8, 30, 15, 42, 3, 55, 20];
  const stock = stocks[index % stocks.length];
  if (stock === 0) return { stock, status: "out_of_stock" };
  if (index === 14) return { stock, status: "draft" };
  return { stock, status: "active" };
}

export const adminProducts: AdminProduct[] = [
  ...bestSellers,
  ...newArrivals,
].map((product, i) => {
  const { stock, status } = deriveStock(i);
  return { ...product, stock, status };
});

export const adminOrders: AdminOrder[] = [
  {
    id: "ORD-001",
    customerName: "Sofia Martinez",
    customerEmail: "sofia@email.com",
    date: "2026-03-10",
    items: [
      { productName: "Wave Hoodie", size: "M", quantity: 1, price: 96 },
      { productName: "LTMF Socks", size: "L/XL", quantity: 2, price: 12 },
    ],
    total: 120,
    status: "processing",
    shippingAddress: "Av. Reforma 222, Col. Juarez, CDMX 06600",
  },
  {
    id: "ORD-002",
    customerName: "Carlos Reyes",
    customerEmail: "carlos.r@email.com",
    date: "2026-03-10",
    items: [{ productName: "Run with the Flow Tee", size: "L", quantity: 1, price: 86 }],
    total: 86,
    status: "processing",
    shippingAddress: "Calle Monterrey 45, Roma Norte, CDMX 06700",
  },
  {
    id: "ORD-003",
    customerName: "Valentina Lopez",
    customerEmail: "val.lopez@email.com",
    date: "2026-03-09",
    items: [
      { productName: "LTMF Crop Top", size: "S", quantity: 1, price: 69 },
      { productName: "LTMF Skirt", size: "S", quantity: 1, price: 64 },
    ],
    total: 133,
    status: "shipped",
    shippingAddress: "Av. Insurgentes Sur 1602, Benito Juarez, CDMX 03940",
  },
  {
    id: "ORD-004",
    customerName: "Diego Hernandez",
    customerEmail: "diego.h@email.com",
    date: "2026-03-08",
    items: [
      { productName: "Basketball Tee", size: "XL", quantity: 1, price: 82 },
      { productName: "LTMF Shorts", size: "L", quantity: 1, price: 43 },
    ],
    total: 125,
    status: "delivered",
    shippingAddress: "Calle Durango 180, Roma Norte, CDMX 06700",
  },
  {
    id: "ORD-005",
    customerName: "Mariana Torres",
    customerEmail: "mariana.t@email.com",
    date: "2026-03-07",
    items: [{ productName: "Mantis Tote Bag", size: "One Size", quantity: 2, price: 27 }],
    total: 54,
    status: "delivered",
    shippingAddress: "Av. Chapultepec 540, Condesa, CDMX 06140",
  },
  {
    id: "ORD-006",
    customerName: "Andres Gomez",
    customerEmail: "andres.g@email.com",
    date: "2026-03-07",
    items: [{ productName: "Wave Hoodie", size: "L", quantity: 1, price: 96 }],
    total: 96,
    status: "cancelled",
    shippingAddress: "Calle Puebla 321, Roma Norte, CDMX 06700",
  },
  {
    id: "ORD-007",
    customerName: "Camila Ruiz",
    customerEmail: "camila.r@email.com",
    date: "2026-03-06",
    items: [
      { productName: "Open Back Crop Top", size: "M", quantity: 1, price: 45 },
      { productName: "Flow Mascada", size: "One Size", quantity: 1, price: 20 },
    ],
    total: 65,
    status: "delivered",
    shippingAddress: "Av. Patriotismo 229, San Pedro de los Pinos, CDMX 03800",
  },
  {
    id: "ORD-008",
    customerName: "Roberto Sanchez",
    customerEmail: "roberto.s@email.com",
    date: "2026-03-05",
    items: [
      { productName: "Mantis Tee", size: "M", quantity: 1, price: 78 },
      { productName: "Running Shorts", size: "M", quantity: 1, price: 38 },
      { productName: "Wave Socks", size: "S/M", quantity: 1, price: 12 },
    ],
    total: 128,
    status: "delivered",
    shippingAddress: "Calle Oaxaca 88, Roma Sur, CDMX 06760",
  },
  {
    id: "ORD-009",
    customerName: "Isabella Flores",
    customerEmail: "isa.flores@email.com",
    date: "2026-03-04",
    items: [
      { productName: "Long Sleeve Crop Top", size: "S", quantity: 1, price: 52 },
      { productName: "LTMF Tote Bag", size: "One Size", quantity: 1, price: 27 },
    ],
    total: 79,
    status: "shipped",
    shippingAddress: "Av. Amsterdam 150, Condesa, CDMX 06100",
  },
  {
    id: "ORD-010",
    customerName: "Lucas Mendoza",
    customerEmail: "lucas.m@email.com",
    date: "2026-03-03",
    items: [{ productName: "LTMF Tee", size: "L", quantity: 2, price: 80 }],
    total: 160,
    status: "delivered",
    shippingAddress: "Calle Colima 267, Roma Norte, CDMX 06700",
  },
];

export const adminCustomers: AdminCustomer[] = [
  { id: "CUS-001", name: "Sofia Martinez", email: "sofia@email.com", totalOrders: 8, totalSpent: 642, joinedDate: "2025-06-12", lastOrderDate: "2026-03-10" },
  { id: "CUS-002", name: "Carlos Reyes", email: "carlos.r@email.com", totalOrders: 5, totalSpent: 384, joinedDate: "2025-08-03", lastOrderDate: "2026-03-10" },
  { id: "CUS-003", name: "Valentina Lopez", email: "val.lopez@email.com", totalOrders: 12, totalSpent: 1105, joinedDate: "2025-04-20", lastOrderDate: "2026-03-09" },
  { id: "CUS-004", name: "Diego Hernandez", email: "diego.h@email.com", totalOrders: 3, totalSpent: 250, joinedDate: "2025-11-15", lastOrderDate: "2026-03-08" },
  { id: "CUS-005", name: "Mariana Torres", email: "mariana.t@email.com", totalOrders: 6, totalSpent: 478, joinedDate: "2025-07-28", lastOrderDate: "2026-03-07" },
  { id: "CUS-006", name: "Andres Gomez", email: "andres.g@email.com", totalOrders: 2, totalSpent: 192, joinedDate: "2026-01-10", lastOrderDate: "2026-03-07" },
  { id: "CUS-007", name: "Camila Ruiz", email: "camila.r@email.com", totalOrders: 9, totalSpent: 720, joinedDate: "2025-05-05", lastOrderDate: "2026-03-06" },
  { id: "CUS-008", name: "Roberto Sanchez", email: "roberto.s@email.com", totalOrders: 4, totalSpent: 356, joinedDate: "2025-09-18", lastOrderDate: "2026-03-05" },
  { id: "CUS-009", name: "Isabella Flores", email: "isa.flores@email.com", totalOrders: 7, totalSpent: 533, joinedDate: "2025-06-30", lastOrderDate: "2026-03-04" },
  { id: "CUS-010", name: "Lucas Mendoza", email: "lucas.m@email.com", totalOrders: 11, totalSpent: 890, joinedDate: "2025-03-22", lastOrderDate: "2026-03-03" },
];

export const dashboardStats: DashboardStats = {
  totalRevenue: 48750,
  ordersToday: 12,
  totalProducts: 18,
  totalCustomers: 234,
  revenueChange: 12.5,
  ordersChange: -3.2,
};

export const revenueData: RevenueDataPoint[] = [
  { month: "Oct", revenue: 6200 },
  { month: "Nov", revenue: 8400 },
  { month: "Dec", revenue: 11200 },
  { month: "Jan", revenue: 7800 },
  { month: "Feb", revenue: 9100 },
  { month: "Mar", revenue: 6050 },
];

export interface AdminNotification {
  id: string;
  type: "order" | "stock" | "customer" | "system";
  title: string;
  message: string;
  date: string;
  read: boolean;
  linkTo?: string;
}

export const adminNotifications: AdminNotification[] = [
  { id: "NTF-001", type: "order", title: "New order placed", message: "Sofia Martinez placed order ORD-001 for $120.00", date: "2026-03-10T14:32:00", read: false, linkTo: "/admin/orders" },
  { id: "NTF-002", type: "order", title: "Order shipped", message: "Order ORD-003 has been shipped via FedEx", date: "2026-03-10T11:15:00", read: false, linkTo: "/admin/orders" },
  { id: "NTF-003", type: "stock", title: "Low stock warning", message: "LTMF Socks has only 5 units remaining", date: "2026-03-10T09:00:00", read: false, linkTo: "/admin/products" },
  { id: "NTF-004", type: "customer", title: "New customer registered", message: "Andres Gomez created a new account", date: "2026-03-09T18:45:00", read: false, linkTo: "/admin/customers" },
  { id: "NTF-005", type: "order", title: "Order cancelled", message: "Andres Gomez cancelled order ORD-006", date: "2026-03-09T16:20:00", read: true, linkTo: "/admin/orders" },
  { id: "NTF-006", type: "stock", title: "Out of stock alert", message: "Wave Hoodie (XS) is now out of stock", date: "2026-03-09T10:30:00", read: true, linkTo: "/admin/products" },
  { id: "NTF-007", type: "system", title: "Settings updated", message: "Shipping rates were updated by admin", date: "2026-03-08T15:00:00", read: true },
  { id: "NTF-008", type: "customer", title: "Repeat customer milestone", message: "Valentina Lopez has placed 12 orders — VIP status reached", date: "2026-03-08T12:10:00", read: false, linkTo: "/admin/customers" },
  { id: "NTF-009", type: "order", title: "New order placed", message: "Carlos Reyes placed order ORD-002 for $86.00", date: "2026-03-08T08:55:00", read: true, linkTo: "/admin/orders" },
  { id: "NTF-010", type: "system", title: "Scheduled maintenance", message: "System maintenance scheduled for March 15, 2:00 AM — 4:00 AM", date: "2026-03-07T20:00:00", read: true },
  { id: "NTF-011", type: "stock", title: "Low stock warning", message: "Running Shorts has only 3 units remaining", date: "2026-03-07T14:30:00", read: true, linkTo: "/admin/products" },
  { id: "NTF-012", type: "customer", title: "New customer registered", message: "Lucas Mendoza created a new account", date: "2026-03-06T10:20:00", read: true, linkTo: "/admin/customers" },
  { id: "NTF-013", type: "order", title: "Order shipped", message: "Order ORD-009 has been shipped via DHL", date: "2026-03-06T09:00:00", read: true, linkTo: "/admin/orders" },
  { id: "NTF-014", type: "system", title: "Export ready", message: "Monthly sales report for February is ready to download", date: "2026-03-05T08:00:00", read: true },
  { id: "NTF-015", type: "stock", title: "Low stock warning", message: "Open Back Crop Top has only 8 units remaining", date: "2026-03-04T16:45:00", read: true, linkTo: "/admin/products" },
];

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  imageHover: string;
  category: string;
  badge?: string;
  sizes: string[];
  isNew?: boolean;
}

export interface Collection {
  id: string;
  name: string;
  season: string;
  description: string;
  image: string;
  tags: string[];
}

export interface EditorialImage {
  id: string;
  src: string;
  alt: string;
  caption: string;
}

export const collections: Collection[] = [
  {
    id: "concrete-jungle-ss26",
    name: "CONCRETE JUNGLE",
    season: "SS26",
    description: "Where raw urban grit meets refined silhouettes. A collection born from city concrete and midnight skylines.",
    image: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1920&q=80&auto=format",
    tags: ["Streetwear", "Essentials", "Limited"],
  },
  {
    id: "shadow-protocol-fw26",
    name: "SHADOW PROTOCOL",
    season: "FW26",
    description: "Dark utility meets minimalist form. Designed for those who move in silence.",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1920&q=80&auto=format",
    tags: ["Outerwear", "Technical", "Archive"],
  },
];

export const bestSellers: Product[] = [
  {
    id: "bs-001",
    name: "Essential Oversized Tee",
    price: 65,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80&auto=format",
    imageHover: "https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=600&q=80&auto=format",
    category: "Tops",
    badge: "Best Seller",
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "bs-002",
    name: "Cargo Wide Pants",
    price: 120,
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80&auto=format",
    imageHover: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80&auto=format",
    category: "Bottoms",
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "bs-003",
    name: "Structure Hoodie",
    price: 145,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80&auto=format",
    imageHover: "https://images.unsplash.com/photo-1578768079470-4c0d87954049?w=600&q=80&auto=format",
    category: "Tops",
    badge: "Low Stock",
    sizes: ["M", "L", "XL"],
  },
  {
    id: "bs-004",
    name: "Utility Vest",
    price: 98,
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80&auto=format",
    imageHover: "https://images.unsplash.com/photo-1608236415053-3691bfa82c5f?w=600&q=80&auto=format",
    category: "Outerwear",
    sizes: ["S", "M", "L"],
  },
  {
    id: "bs-005",
    name: "Relaxed Linen Shirt",
    price: 85,
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80&auto=format",
    imageHover: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80&auto=format",
    category: "Tops",
    badge: "Best Seller",
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "bs-006",
    name: "Tech Joggers",
    price: 110,
    image: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600&q=80&auto=format",
    imageHover: "https://images.unsplash.com/photo-1562183241-b937e95585b6?w=600&q=80&auto=format",
    category: "Bottoms",
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "bs-007",
    name: "Minimal Leather Belt",
    price: 55,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80&auto=format",
    imageHover: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&q=80&auto=format",
    category: "Accessories",
    sizes: ["S", "M", "L"],
  },
  {
    id: "bs-008",
    name: "Cropped Bomber",
    price: 195,
    image: "https://images.unsplash.com/photo-1548883354-7622d03579a2?w=600&q=80&auto=format",
    imageHover: "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=600&q=80&auto=format",
    category: "Outerwear",
    badge: "Best Seller",
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "bs-009",
    name: "Heavyweight Pocket Tee",
    price: 48,
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80&auto=format",
    imageHover: "https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=600&q=80&auto=format",
    category: "Tops",
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "bs-010",
    name: "Slim Chinos",
    price: 95,
    image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=80&auto=format",
    imageHover: "https://images.unsplash.com/photo-1519722417352-7d6959729417?w=600&q=80&auto=format",
    category: "Bottoms",
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "bs-011",
    name: "Canvas Tote Bag",
    price: 42,
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80&auto=format",
    imageHover: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&q=80&auto=format",
    category: "Accessories",
    badge: "Best Seller",
    sizes: ["One Size"],
  },
  {
    id: "bs-012",
    name: "Quarter Zip Fleece",
    price: 130,
    image: "https://images.unsplash.com/photo-1614975059251-992f11792571?w=600&q=80&auto=format",
    imageHover: "https://images.unsplash.com/photo-1578932750294-f5075e85f44a?w=600&q=80&auto=format",
    category: "Tops",
    sizes: ["S", "M", "L", "XL"],
  },
];

export const newArrivals: Product[] = [
  {
    id: "na-001",
    name: "Shadow Bomber Jacket",
    price: 220,
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80&auto=format",
    imageHover: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&q=80&auto=format",
    category: "Outerwear",
    badge: "New",
    sizes: ["S", "M", "L", "XL"],
    isNew: true,
  },
  {
    id: "na-002",
    name: "Concrete Crewneck",
    price: 95,
    image: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=600&q=80&auto=format",
    imageHover: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80&auto=format",
    category: "Tops",
    badge: "New",
    sizes: ["S", "M", "L", "XL"],
    isNew: true,
  },
  {
    id: "na-003",
    name: "Monochrome Track Pants",
    price: 110,
    image: "https://images.unsplash.com/photo-1580906853149-f66bfce5e43c?w=600&q=80&auto=format",
    imageHover: "https://images.unsplash.com/photo-1612462766980-e0ccc6ba7105?w=600&q=80&auto=format",
    category: "Bottoms",
    badge: "New",
    sizes: ["S", "M", "L"],
    isNew: true,
  },
  {
    id: "na-004",
    name: "Stealth Windbreaker",
    price: 175,
    image: "https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?w=600&q=80&auto=format",
    imageHover: "https://images.unsplash.com/photo-1559582798-678dfc71ccd8?w=600&q=80&auto=format",
    category: "Outerwear",
    badge: "New",
    sizes: ["M", "L", "XL"],
    isNew: true,
  },
  {
    id: "na-005",
    name: "Raw Hem Denim",
    price: 135,
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80&auto=format",
    imageHover: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80&auto=format",
    category: "Bottoms",
    badge: "New",
    sizes: ["S", "M", "L", "XL"],
    isNew: true,
  },
  {
    id: "na-006",
    name: "Mesh Layer Tank",
    price: 55,
    image: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&q=80&auto=format",
    imageHover: "https://images.unsplash.com/photo-1571455786673-9d9d6c194f90?w=600&q=80&auto=format",
    category: "Tops",
    badge: "New",
    sizes: ["S", "M", "L"],
    isNew: true,
  },
];

export const editorialImages: EditorialImage[] = [
  {
    id: "ed-001",
    src: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80&auto=format",
    alt: "Urban editorial - street style",
    caption: "Concrete Jungle SS26 Lookbook",
  },
  {
    id: "ed-002",
    src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80&auto=format",
    alt: "Minimalist fashion editorial",
    caption: "Form Follows Function",
  },
  {
    id: "ed-003",
    src: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80&auto=format",
    alt: "Streetwear editorial shot",
    caption: "Between Light & Shadow",
  },
];

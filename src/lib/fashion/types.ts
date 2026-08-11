export type ProductColor = {
  name: string;
  hex: string;
};

export type Category = {
  slug: string;
  title: string;
  titleBn: string;
  subtitle: string;
  accent: string;
  description: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  nameBn: string;
  price: number;
  compareAtPrice?: number;
  categorySlug: string;
  label?: string;
  description: string;
  descriptionBn: string;
  fabric: string;
  sizes: string[];
  colors: ProductColor[];
  tone: string;
  imageUrl: string;
  featured?: boolean;
  inStock: boolean;
};

export type CartItem = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  tone: string;
  imageUrl?: string;
};

export type CheckoutForm = {
  name: string;
  phone: string;
  email: string;
  address: string;
  district: string;
  note: string;
  paymentMethod: "cod" | "bkash" | "nagad";
};

export type FashionCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  createdAt: string;
};

export type FashionOrderItem = {
  productId: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
};

export type FashionOrder = {
  id: string;
  customerId?: string;
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  district: string;
  note?: string;
  paymentMethod: CheckoutForm["paymentMethod"];
  items: FashionOrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: "pending" | "confirmed" | "delivered";
  createdAt: string;
};

export type FashionStore = {
  products: Product[];
  customers: FashionCustomer[];
  orders: FashionOrder[];
  adminPasswordHash: string;
};

export type ProductInput = Omit<Product, "id" | "slug"> & {
  id?: string;
  slug?: string;
};

export type SearchFilters = {
  query?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sort?: "featured" | "price-asc" | "price-desc" | "newest";
};

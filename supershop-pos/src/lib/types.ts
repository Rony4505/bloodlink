export type PaymentMethod = "cash" | "card" | "bkash" | "nagad";

export type ProductCategory =
  | "men"
  | "women"
  | "kids"
  | "accessories"
  | "grocery"
  | "other";

export type Product = {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: ProductCategory;
  brand?: string;
  description?: string;
  price: number;
  cost: number;
  stock: number;
  lowStockAt: number;
  sizes: string[];
  colors: string[];
  imageHue: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CartLine = {
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  qty: number;
  size?: string;
  color?: string;
};

export type Sale = {
  id: string;
  invoiceNo: string;
  lines: CartLine[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  createdAt: string;
  cashier: string;
};

export type ShopSettings = {
  shopName: string;
  tagline: string;
  address: string;
  phone: string;
  currency: string;
  pinHash: string;
  taxRate: number;
};

export type StoreData = {
  settings: ShopSettings;
  products: Product[];
  sales: Sale[];
};

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

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

export type DeliveryRule = {
  id: string;
  district: string;
  fee: number;
  minOrderForFree?: number;
  active: boolean;
};

export type Coupon = {
  id: string;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  minOrder?: number;
  expiresAt?: string;
  active: boolean;
};

export type PromoBanner = {
  id: string;
  imageUrl: string;
  title?: string;
  linkSlug?: string;
  productId?: string;
  active: boolean;
  expiresAt?: string;
  sortOrder: number;
};

export type StoreSettings = {
  brandName: string;
  brandTagline: string;
  defaultMarkupPercent: number;
  pricingMode: "markup" | "manual";
  deliveryRules: DeliveryRule[];
  heroTitle?: string;
  heroSubtitle?: string;
  heroDescription?: string;
  contactEmail?: string;
  contactPhone?: string;
  whatsapp?: string;
  footerText?: string;
  aboutText?: string;
  freeShippingNote?: string;
  showCouponsOnHome?: boolean;
  promoBanners?: PromoBanner[];
  availableSizes?: string[];
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  nameBn: string;
  price: number;
  buyPrice: number;
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
  stock: number;
  featured?: boolean;
  inStock: boolean;
  pricingMode?: "markup" | "manual";
  markupPercent?: number;
  offerActive?: boolean;
  offerLabel?: string;
  offerDiscountPercent?: number;
  isNew?: boolean;
  createdAt: string;
};

export type ProductReview = {
  id: string;
  productId: string;
  customerId?: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
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
  couponCode?: string;
};

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type OrderStatusUpdate = {
  status: OrderStatus;
  message: string;
  updatedAt: string;
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
  buyPrice: number;
  size: string;
  color: string;
  quantity: number;
};

export type FashionOrder = {
  id: string;
  trackingNumber: string;
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
  discount: number;
  couponCode?: string;
  shipping: number;
  total: number;
  costTotal: number;
  status: OrderStatus;
  statusHistory: OrderStatusUpdate[];
  createdAt: string;
};

export type UserNotification = {
  id: string;
  customerId?: string;
  type: "new_product" | "new_offer" | "order_update";
  title: string;
  body: string;
  link?: string;
  readBy: string[];
  createdAt: string;
};

export type AdminNotification = {
  id: string;
  type: "new_order";
  title: string;
  body: string;
  orderId?: string;
  read: boolean;
  createdAt: string;
};

export type FashionStore = {
  settings: StoreSettings;
  categories: Category[];
  products: Product[];
  customers: FashionCustomer[];
  orders: FashionOrder[];
  coupons: Coupon[];
  reviews: ProductReview[];
  userNotifications: UserNotification[];
  adminNotifications: AdminNotification[];
  adminPasswordHash: string;
};

export type ProductInput = Omit<Product, "id" | "slug" | "createdAt"> & {
  id?: string;
  slug?: string;
  createdAt?: string;
};

export type SearchFilters = {
  query?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sort?: "featured" | "price-asc" | "price-desc" | "newest";
};

export type AnalyticsSummary = {
  period: "daily" | "monthly";
  revenue: number;
  cost: number;
  profit: number;
  deliveryFees: number;
  orderCount: number;
  cancelledCount: number;
};

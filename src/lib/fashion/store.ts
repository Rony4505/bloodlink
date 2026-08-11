import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import { computeSellPrice, getEffectivePrice } from "./pricing";
import { defaultCategories, defaultSettings } from "./defaults";
import { seedProducts as rawSeedProducts } from "./seed-products";
import { slugify } from "./search";
import type {
  AdminNotification,
  AnalyticsSummary,
  Category,
  Coupon,
  FashionCustomer,
  FashionOrder,
  FashionStore,
  OrderStatus,
  OrderStatusUpdate,
  Product,
  ProductInput,
  ProductReview,
  StoreSettings,
  UserNotification,
} from "./types";
import { computeAnalytics } from "./analytics";

const dataDir = path.join(/* turbopackIgnore: true */ process.cwd(), "data");
const storePath = path.join(/* turbopackIgnore: true */ dataDir, "fashion-store.json");

function migrateProduct(product: Partial<Product>, settings: StoreSettings): Product {
  const buyPrice = product.buyPrice ?? Math.round((product.price ?? 0) / 1.35);
  const price =
    product.price ??
    computeSellPrice(buyPrice, settings, {
      pricingMode: product.pricingMode,
      markupPercent: product.markupPercent,
      ...(product.price !== undefined ? { price: product.price } : {}),
    });
  const stock = product.stock ?? (product.inStock === false ? 0 : 25);
  return {
    id: product.id!,
    slug: product.slug!,
    name: product.name!,
    nameBn: product.nameBn!,
    price,
    buyPrice,
    compareAtPrice: product.compareAtPrice,
    categorySlug: product.categorySlug!,
    label: product.label,
    description: product.description!,
    descriptionBn: product.descriptionBn!,
    fabric: product.fabric!,
    sizes: product.sizes ?? ["S", "M", "L"],
    colors: product.colors ?? [{ name: "Default", hex: "#f8efe9" }],
    tone: product.tone ?? "bg-[#f8efe9]",
    imageUrl: product.imageUrl!,
    stock,
    featured: product.featured,
    inStock: stock > 0,
    pricingMode: product.pricingMode,
    markupPercent: product.markupPercent,
    offerActive: product.offerActive,
    offerLabel: product.offerLabel,
    offerDiscountPercent: product.offerDiscountPercent,
    isNew: product.isNew,
    createdAt: product.createdAt ?? new Date().toISOString(),
  };
}

function migrateOrder(order: Partial<FashionOrder>): FashionOrder {
  const status = order.status ?? "pending";
  return {
    id: order.id!,
    customerId: order.customerId,
    customerName: order.customerName!,
    phone: order.phone!,
    email: order.email,
    address: order.address!,
    district: order.district!,
    note: order.note,
    paymentMethod: order.paymentMethod ?? "cod",
    items: (order.items ?? []).map((item) => ({
      ...item,
      buyPrice: item.buyPrice ?? Math.round(item.price / 1.35),
    })),
    subtotal: order.subtotal ?? 0,
    discount: order.discount ?? 0,
    couponCode: order.couponCode,
    shipping: order.shipping ?? 0,
    total: order.total ?? 0,
    costTotal:
      order.costTotal ??
      (order.items ?? []).reduce(
        (sum, item) => sum + (item.buyPrice ?? Math.round(item.price / 1.35)) * item.quantity,
        0,
      ),
    status,
    statusHistory: order.statusHistory ?? [
      { status, message: "অর্ডার গ্রহণ করা হয়েছে", updatedAt: order.createdAt ?? new Date().toISOString() },
    ],
    createdAt: order.createdAt ?? new Date().toISOString(),
  };
}

async function ensureStore(): Promise<FashionStore> {
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<FashionStore>;
    const settings: StoreSettings = {
      ...defaultSettings,
      ...parsed.settings,
      deliveryRules: parsed.settings?.deliveryRules?.length
        ? parsed.settings.deliveryRules
        : defaultSettings.deliveryRules,
    };
    const products = (parsed.products?.length ? parsed.products : rawSeedProducts).map((p) =>
      migrateProduct(p, settings),
    );
    return {
      settings,
      categories: parsed.categories?.length ? parsed.categories : defaultCategories,
      products,
      customers: parsed.customers ?? [],
      orders: (parsed.orders ?? []).map(migrateOrder),
      coupons: parsed.coupons ?? [],
      reviews: parsed.reviews ?? [],
      userNotifications: parsed.userNotifications ?? [],
      adminNotifications: parsed.adminNotifications ?? [],
      adminPasswordHash:
        parsed.adminPasswordHash ||
        (await bcrypt.hash(process.env.FASHION_ADMIN_PASSWORD || "nooreadmin", 12)),
    };
  } catch {
    await mkdir(dataDir, { recursive: true });
    const settings = defaultSettings;
    const initial: FashionStore = {
      settings,
      categories: defaultCategories,
      products: rawSeedProducts.map((p) => migrateProduct(p, settings)),
      customers: [],
      orders: [],
      coupons: [],
      reviews: [],
      userNotifications: [],
      adminNotifications: [],
      adminPasswordHash: await bcrypt.hash(
        process.env.FASHION_ADMIN_PASSWORD || "nooreadmin",
        12,
      ),
    };
    await writeStore(initial);
    return initial;
  }
}

async function writeStore(store: FashionStore): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

export async function getStoreSettings(): Promise<StoreSettings> {
  const store = await ensureStore();
  return store.settings;
}

export async function updateStoreSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
  const store = await ensureStore();
  store.settings = { ...store.settings, ...settings };
  await writeStore(store);
  return store.settings;
}

export async function listCategories(): Promise<Category[]> {
  const store = await ensureStore();
  return store.categories;
}

export async function updateCategories(categories: Category[]): Promise<Category[]> {
  const store = await ensureStore();
  store.categories = categories;
  await writeStore(store);
  return store.categories;
}

export async function listProducts(): Promise<Product[]> {
  const store = await ensureStore();
  return store.products;
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const store = await ensureStore();
  return store.products.find((product) => product.slug === slug);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const store = await ensureStore();
  return store.products.find((p) => p.id === id);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const products = await listProducts();
  return products.filter((product) => product.featured);
}

export async function getActiveOffers(): Promise<Product[]> {
  const store = await ensureStore();
  return store.products.filter((p) => p.offerActive);
}

export async function getNewProducts(sinceDays = 14): Promise<Product[]> {
  const store = await ensureStore();
  const cutoff = Date.now() - sinceDays * 86400000;
  return store.products.filter((p) => new Date(p.createdAt).getTime() > cutoff || p.isNew);
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const products = await listProducts();
  return products.filter((product) => product.categorySlug === categorySlug);
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const products = await listProducts();
  return products
    .filter((item) => item.categorySlug === product.categorySlug && item.id !== product.id)
    .slice(0, limit);
}

function resolveProductPrice(input: ProductInput, settings: StoreSettings): Product {
  const buyPrice = input.buyPrice ?? Math.round((input.price ?? 0) / 1.35);
  const basePrice = computeSellPrice(buyPrice, settings, input);
  const stock = input.stock ?? 0;
  return {
    id: input.id ?? `p${Date.now()}`,
    slug: input.slug ?? slugify(input.nameBn || input.name),
    name: input.name,
    nameBn: input.nameBn,
    price: input.pricingMode === "manual" && input.price ? input.price : basePrice,
    buyPrice,
    compareAtPrice: input.compareAtPrice,
    categorySlug: input.categorySlug,
    label: input.label,
    description: input.description,
    descriptionBn: input.descriptionBn,
    fabric: input.fabric,
    sizes: input.sizes,
    colors: input.colors,
    tone: input.tone,
    imageUrl: input.imageUrl,
    stock,
    featured: input.featured,
    inStock: stock > 0,
    pricingMode: input.pricingMode,
    markupPercent: input.markupPercent,
    offerActive: input.offerActive,
    offerLabel: input.offerLabel,
    offerDiscountPercent: input.offerDiscountPercent,
    isNew: input.isNew ?? !input.id,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

export async function upsertProduct(input: ProductInput): Promise<Product> {
  const store = await ensureStore();
  const isNew = !input.id || !store.products.find((p) => p.id === input.id);
  const product = resolveProductPrice(input, store.settings);
  const index = store.products.findIndex((item) => item.id === product.id);
  if (index >= 0) {
    store.products[index] = { ...store.products[index], ...product, createdAt: store.products[index].createdAt };
  } else {
    store.products.push(product);
  }

  if (isNew) {
    await notifyUsersNewProduct(store, product);
  }
  if (input.offerActive && !store.products.find((p) => p.id === product.id)?.offerActive) {
    await notifyUsersNewOffer(store, product);
  }

  await writeStore(store);
  return product;
}

async function notifyUsersNewProduct(store: FashionStore, product: Product): Promise<void> {
  const notification: UserNotification = {
    id: `un${Date.now()}`,
    type: "new_product",
    title: "নতুন প্রোডাক্ট",
    body: `${product.nameBn} এখন Slowgun-এ উপলব্ধ`,
    link: `/products/${product.slug}`,
    readBy: [],
    createdAt: new Date().toISOString(),
  };
  store.userNotifications.unshift(notification);
}

async function notifyUsersNewOffer(store: FashionStore, product: Product): Promise<void> {
  const notification: UserNotification = {
    id: `un${Date.now()}o`,
    type: "new_offer",
    title: product.offerLabel ?? "নতুন অফার",
    body: `${product.nameBn}-এ ${product.offerDiscountPercent ?? 0}% ছাড়`,
    link: `/products/${product.slug}`,
    readBy: [],
    createdAt: new Date().toISOString(),
  };
  store.userNotifications.unshift(notification);
}

export async function deleteProduct(id: string): Promise<boolean> {
  const store = await ensureStore();
  const next = store.products.filter((product) => product.id !== id);
  if (next.length === store.products.length) return false;
  store.products = next;
  await writeStore(store);
  return true;
}

export async function decrementStock(productId: string, quantity: number): Promise<boolean> {
  const store = await ensureStore();
  const product = store.products.find((p) => p.id === productId);
  if (!product || product.stock < quantity) return false;
  product.stock -= quantity;
  product.inStock = product.stock > 0;
  await writeStore(store);
  return true;
}

export async function listCoupons(): Promise<Coupon[]> {
  const store = await ensureStore();
  return store.coupons;
}

export async function upsertCoupon(coupon: Coupon): Promise<Coupon> {
  const store = await ensureStore();
  const index = store.coupons.findIndex((c) => c.id === coupon.id);
  if (index >= 0) store.coupons[index] = coupon;
  else store.coupons.push(coupon);
  await writeStore(store);
  return coupon;
}

export async function deleteCoupon(id: string): Promise<boolean> {
  const store = await ensureStore();
  const next = store.coupons.filter((c) => c.id !== id);
  if (next.length === store.coupons.length) return false;
  store.coupons = next;
  await writeStore(store);
  return true;
}

export async function validateCoupon(code: string, subtotal: number): Promise<Coupon | null> {
  const store = await ensureStore();
  const coupon = store.coupons.find(
    (c) => c.active && c.code.toLowerCase() === code.trim().toLowerCase(),
  );
  if (!coupon) return null;
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return null;
  if (coupon.minOrder && subtotal < coupon.minOrder) return null;
  return coupon;
}

export async function listReviews(productId?: string): Promise<ProductReview[]> {
  const store = await ensureStore();
  const reviews = store.reviews.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return productId ? reviews.filter((r) => r.productId === productId) : reviews;
}

export async function addReview(input: Omit<ProductReview, "id" | "createdAt">): Promise<ProductReview> {
  const store = await ensureStore();
  const review: ProductReview = {
    ...input,
    id: `rv${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  store.reviews.unshift(review);
  await writeStore(store);
  return review;
}

export async function listUserNotifications(customerId?: string): Promise<UserNotification[]> {
  const store = await ensureStore();
  return store.userNotifications.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function markNotificationRead(notificationId: string, customerId: string): Promise<void> {
  const store = await ensureStore();
  const notification = store.userNotifications.find((n) => n.id === notificationId);
  if (notification && !notification.readBy.includes(customerId)) {
    notification.readBy.push(customerId);
    await writeStore(store);
  }
}

export async function listAdminNotifications(): Promise<AdminNotification[]> {
  const store = await ensureStore();
  return store.adminNotifications.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function markAdminNotificationRead(id: string): Promise<void> {
  const store = await ensureStore();
  const n = store.adminNotifications.find((item) => item.id === id);
  if (n) {
    n.read = true;
    await writeStore(store);
  }
}

export async function listCustomers(): Promise<FashionCustomer[]> {
  const store = await ensureStore();
  return store.customers;
}

export async function findCustomerByEmail(email: string): Promise<FashionCustomer | undefined> {
  const customers = await listCustomers();
  return customers.find(
    (customer) => customer.email.toLowerCase() === email.trim().toLowerCase(),
  );
}

export async function findCustomerById(id: string): Promise<FashionCustomer | undefined> {
  const customers = await listCustomers();
  return customers.find((customer) => customer.id === id);
}

export async function createCustomer(input: {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
}): Promise<FashionCustomer> {
  const store = await ensureStore();
  const customer: FashionCustomer = {
    id: `c${Date.now()}`,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    passwordHash: input.passwordHash,
    createdAt: new Date().toISOString(),
  };
  store.customers.push(customer);
  await writeStore(store);
  return customer;
}

export async function listOrders(): Promise<FashionOrder[]> {
  const store = await ensureStore();
  return store.orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listOrdersForCustomer(customerId: string): Promise<FashionOrder[]> {
  const orders = await listOrders();
  return orders.filter((order) => order.customerId === customerId);
}

export async function getOrderById(id: string): Promise<FashionOrder | undefined> {
  const orders = await listOrders();
  return orders.find((o) => o.id === id);
}

export async function createOrder(
  order: Omit<FashionOrder, "id" | "createdAt" | "status" | "statusHistory">,
): Promise<FashionOrder> {
  const store = await ensureStore();
  const now = new Date().toISOString();
  const record: FashionOrder = {
    ...order,
    id: `SG${Date.now().toString().slice(-8)}`,
    status: "pending",
    statusHistory: [{ status: "pending", message: "অর্ডার গ্রহণ করা হয়েছে", updatedAt: now }],
    createdAt: now,
  };

  for (const item of record.items) {
    const product = store.products.find((p) => p.id === item.productId);
    if (product) {
      product.stock = Math.max(0, product.stock - item.quantity);
      product.inStock = product.stock > 0;
    }
  }

  store.orders.unshift(record);
  store.adminNotifications.unshift({
    id: `an${Date.now()}`,
    type: "new_order",
    title: "নতুন অর্ডার",
    body: `${record.customerName} · ${record.id} · ৳${record.total}`,
    orderId: record.id,
    read: false,
    createdAt: now,
  });

  if (record.customerId) {
    store.userNotifications.unshift({
      id: `un${Date.now()}ord`,
      customerId: record.customerId,
      type: "order_update",
      title: "অর্ডার নিশ্চিত",
      body: `আপনার অর্ডার ${record.id} গ্রহণ করা হয়েছে`,
      link: "/account",
      readBy: [],
      createdAt: now,
    });
  }

  await writeStore(store);
  return record;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  message: string,
): Promise<FashionOrder | null> {
  const store = await ensureStore();
  const order = store.orders.find((o) => o.id === orderId);
  if (!order) return null;

  const now = new Date().toISOString();
  order.status = status;
  order.statusHistory.push({ status, message, updatedAt: now });

  if (order.customerId) {
    store.userNotifications.unshift({
      id: `un${Date.now()}st`,
      customerId: order.customerId,
      type: "order_update",
      title: "অর্ডার আপডেট",
      body: message,
      link: "/account",
      readBy: [],
      createdAt: now,
    });
  }

  await writeStore(store);
  return order;
}

export async function getAnalytics(period: "daily" | "monthly"): Promise<AnalyticsSummary> {
  const store = await ensureStore();
  return computeAnalytics(store.orders, period);
}

export async function verifyFashionAdminPassword(password: string): Promise<boolean> {
  const store = await ensureStore();
  return bcrypt.compare(password, store.adminPasswordHash);
}

export { rawSeedProducts as seedProducts };

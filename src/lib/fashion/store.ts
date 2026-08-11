import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import { seedProducts } from "./seed-products";
import { slugify } from "./search";
import type {
  FashionCustomer,
  FashionOrder,
  FashionStore,
  Product,
  ProductInput,
} from "./types";

const dataDir = path.join(/* turbopackIgnore: true */ process.cwd(), "data");
const storePath = path.join(/* turbopackIgnore: true */ dataDir, "fashion-store.json");

async function ensureStore(): Promise<FashionStore> {
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as FashionStore;
    return {
      products: parsed.products?.length ? parsed.products : seedProducts,
      customers: parsed.customers ?? [],
      orders: parsed.orders ?? [],
      adminPasswordHash:
        parsed.adminPasswordHash ||
        (await bcrypt.hash(process.env.FASHION_ADMIN_PASSWORD || "nooreadmin", 12)),
    };
  } catch {
    await mkdir(dataDir, { recursive: true });
    const initial: FashionStore = {
      products: seedProducts,
      customers: [],
      orders: [],
      adminPasswordHash: await bcrypt.hash(
        process.env.FASHION_ADMIN_PASSWORD || "nooreadmin",
        12,
      ),
    };
    await writeFile(storePath, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }
}

async function writeStore(store: FashionStore): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

export async function listProducts(): Promise<Product[]> {
  const store = await ensureStore();
  return store.products;
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const products = await listProducts();
  return products.find((product) => product.slug === slug);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const products = await listProducts();
  return products.filter((product) => product.featured);
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const products = await listProducts();
  return products.filter((product) => product.categorySlug === categorySlug);
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const products = await listProducts();
  return products
    .filter(
      (item) => item.categorySlug === product.categorySlug && item.id !== product.id,
    )
    .slice(0, limit);
}

export async function upsertProduct(input: ProductInput): Promise<Product> {
  const store = await ensureStore();
  const id = input.id ?? `p${Date.now()}`;
  const slug = input.slug ?? slugify(input.nameBn || input.name);
  const product: Product = { ...input, id, slug };

  const index = store.products.findIndex((item) => item.id === id);
  if (index >= 0) {
    store.products[index] = product;
  } else {
    store.products.push(product);
  }

  await writeStore(store);
  return product;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const store = await ensureStore();
  const next = store.products.filter((product) => product.id !== id);
  if (next.length === store.products.length) return false;
  store.products = next;
  await writeStore(store);
  return true;
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

export async function createOrder(
  order: Omit<FashionOrder, "id" | "createdAt" | "status">,
): Promise<FashionOrder> {
  const store = await ensureStore();
  const record: FashionOrder = {
    ...order,
    id: `ND${Date.now().toString().slice(-8)}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  store.orders.unshift(record);
  await writeStore(store);
  return record;
}

export async function verifyFashionAdminPassword(password: string): Promise<boolean> {
  const store = await ensureStore();
  return bcrypt.compare(password, store.adminPasswordHash);
}

export { seedProducts };

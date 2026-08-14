"use client";

import { cartTotal, lineTotal } from "./format";
import { DEFAULT_PRODUCTS, DEFAULT_SETTINGS } from "./seed";
import type { CartLine, DueCollection, PosData, Product, Sale } from "./types";

const STORAGE_KEY = "mudidokan-pos-v2";
const LEGACY_KEY = "mudidokan-pos-v1";

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeProduct(raw: Partial<Product> & { id: string }): Product {
  const fallback = DEFAULT_PRODUCTS.find((p) => p.id === raw.id);
  return {
    id: raw.id,
    name: raw.name ?? fallback?.name ?? "পণ্য",
    price: raw.price ?? fallback?.price ?? 0,
    unit: raw.unit ?? fallback?.unit ?? "পিস",
    color: raw.color ?? fallback?.color ?? "#E8F5E9",
    barcode: raw.barcode ?? fallback?.barcode,
  };
}

function normalizeCartLine(raw: Partial<CartLine> & { productId: string; name: string; price: number; unit: string }): CartLine {
  return {
    lineId: raw.lineId ?? newId(),
    productId: raw.productId,
    name: raw.name,
    price: raw.price,
    unit: raw.unit,
    qty: raw.qty ?? 1,
    weight: raw.weight,
  };
}

function normalizeSale(raw: Partial<Sale> & { id: string; items: CartLine[]; total: number; createdAt: string }, index: number): Sale {
  const paid = raw.paid ?? raw.total;
  const due = raw.due ?? Math.max(0, raw.total - paid);
  return {
    id: raw.id,
    invoiceNo: raw.invoiceNo ?? String(index + 1).padStart(4, "0"),
    items: raw.items.map((i) => normalizeCartLine(i)),
    total: raw.total,
    paid,
    change: raw.change ?? Math.max(0, paid - raw.total),
    due,
    customerName: raw.customerName,
    customerPhone: raw.customerPhone,
    collections: raw.collections ?? [],
    createdAt: raw.createdAt,
  };
}

function migrateLegacy(raw: string): PosData | null {
  try {
    const parsed = JSON.parse(raw) as Partial<PosData>;
    if (!parsed.products?.length) return null;
    return {
      products: parsed.products.map((p) => normalizeProduct(p as Product)),
      sales: (parsed.sales ?? []).map((s, i) =>
        normalizeSale(s as Sale, i),
      ),
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      invoiceCounter: parsed.sales?.length ?? 0,
    };
  } catch {
    return null;
  }
}

export function loadPosData(): PosData {
  if (typeof window === "undefined") {
    return { products: DEFAULT_PRODUCTS, sales: [], settings: DEFAULT_SETTINGS, invoiceCounter: 0 };
  }
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        const migrated = migrateLegacy(legacy);
        if (migrated) {
          savePosData(migrated);
          return migrated;
        }
      }
      return { products: DEFAULT_PRODUCTS, sales: [], settings: DEFAULT_SETTINGS, invoiceCounter: 0 };
    }
    const parsed = JSON.parse(raw) as Partial<PosData>;
    return {
      products: (parsed.products?.length ? parsed.products : DEFAULT_PRODUCTS).map((p) =>
        normalizeProduct(p as Product),
      ),
      sales: (parsed.sales ?? []).map((s, i) => normalizeSale(s as Sale, i)),
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      invoiceCounter: parsed.invoiceCounter ?? parsed.sales?.length ?? 0,
    };
  } catch {
    return { products: DEFAULT_PRODUCTS, sales: [], settings: DEFAULT_SETTINGS, invoiceCounter: 0 };
  }
}

export function savePosData(data: PosData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function findProductByBarcode(products: Product[], code: string): Product | undefined {
  const trimmed = code.trim();
  if (!trimmed) return undefined;
  return products.find((p) => p.barcode && p.barcode === trimmed);
}

export function addProduct(
  data: PosData,
  input: { name: string; price: number; unit: string; color: string; barcode?: string },
): PosData {
  const product: Product = {
    id: newId(),
    name: input.name.trim(),
    price: Math.max(0, Math.round(input.price)),
    unit: input.unit.trim() || "পিস",
    color: input.color || "#E8F5E9",
    barcode: input.barcode?.trim() || undefined,
  };
  const next = { ...data, products: [...data.products, product] };
  savePosData(next);
  return next;
}

export function removeProduct(data: PosData, productId: string): PosData {
  const next = {
    ...data,
    products: data.products.filter((p) => p.id !== productId),
  };
  savePosData(next);
  return next;
}

export function updateShopName(data: PosData, shopName: string): PosData {
  const next = { ...data, settings: { ...data.settings, shopName: shopName.trim() } };
  savePosData(next);
  return next;
}

export function recordSale(
  data: PosData,
  input: {
    items: CartLine[];
    paid: number;
    customerName?: string;
    customerPhone?: string;
  },
): { data: PosData; sale: Sale } {
  const total = cartTotal(input.items);
  const paid = Math.max(0, input.paid);
  const due = Math.max(0, total - paid);
  const change = Math.max(0, paid - total);
  const invoiceCounter = data.invoiceCounter + 1;
  const sale: Sale = {
    id: newId(),
    invoiceNo: String(invoiceCounter).padStart(4, "0"),
    items: input.items,
    total,
    paid,
    change,
    due,
    customerName: input.customerName?.trim() || undefined,
    customerPhone: input.customerPhone?.trim() || undefined,
    collections: [],
    createdAt: new Date().toISOString(),
  };

  const next = { ...data, sales: [...data.sales, sale], invoiceCounter };
  savePosData(next);
  return { data: next, sale };
}

export function collectDue(
  data: PosData,
  saleId: string,
  amount: number,
  note?: string,
): { data: PosData; sale: Sale } | null {
  const sale = data.sales.find((s) => s.id === saleId);
  if (!sale || sale.due <= 0) return null;
  const collectAmount = Math.min(Math.max(0, amount), sale.due);
  if (collectAmount <= 0) return null;

  const collection: DueCollection = {
    id: newId(),
    amount: collectAmount,
    createdAt: new Date().toISOString(),
    note: note?.trim() || undefined,
  };

  const updated: Sale = {
    ...sale,
    due: sale.due - collectAmount,
    paid: sale.paid + collectAmount,
    collections: [...sale.collections, collection],
  };

  const next = {
    ...data,
    sales: data.sales.map((s) => (s.id === saleId ? updated : s)),
  };
  savePosData(next);
  return { data: next, sale: updated };
}

export function salesForDate(data: PosData, dateKey: string): Sale[] {
  return data.sales.filter((s) => {
    const key = new Date(s.createdAt).toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
    return key === dateKey;
  });
}

export type ProductReportRow = {
  productId: string;
  name: string;
  unit: string;
  qty: number;
  weight: number;
  revenue: number;
};

export function productReportForDate(data: PosData, dateKey: string): ProductReportRow[] {
  const map = new Map<string, ProductReportRow>();
  for (const sale of salesForDate(data, dateKey)) {
    for (const line of sale.items) {
      const key = line.productId;
      const existing = map.get(key) ?? {
        productId: key,
        name: line.name,
        unit: line.unit,
        qty: 0,
        weight: 0,
        revenue: 0,
      };
      if (line.weight != null) {
        existing.weight += line.weight;
      } else {
        existing.qty += line.qty;
      }
      existing.revenue += lineTotal(line);
      map.set(key, existing);
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}

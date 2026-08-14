"use client";

import { DEFAULT_PRODUCTS, DEFAULT_SETTINGS } from "./seed";
import type { CartLine, PosData, Product, Sale } from "./types";

const STORAGE_KEY = "mudidokan-pos-v1";

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadPosData(): PosData {
  if (typeof window === "undefined") {
    return { products: DEFAULT_PRODUCTS, sales: [], settings: DEFAULT_SETTINGS };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { products: DEFAULT_PRODUCTS, sales: [], settings: DEFAULT_SETTINGS };
    }
    const parsed = JSON.parse(raw) as Partial<PosData>;
    return {
      products: parsed.products?.length ? parsed.products : DEFAULT_PRODUCTS,
      sales: parsed.sales ?? [],
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    };
  } catch {
    return { products: DEFAULT_PRODUCTS, sales: [], settings: DEFAULT_SETTINGS };
  }
}

export function savePosData(data: PosData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.price * line.qty, 0);
}

export function addProduct(
  data: PosData,
  input: { name: string; price: number; unit: string },
): PosData {
  const product: Product = {
    id: newId(),
    name: input.name.trim(),
    price: Math.max(0, Math.round(input.price)),
    unit: input.unit.trim() || "পিস",
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
  items: CartLine[],
  paid: number,
): { data: PosData; sale: Sale } {
  const total = cartTotal(items);
  const sale: Sale = {
    id: newId(),
    items,
    total,
    paid,
    change: Math.max(0, paid - total),
    createdAt: new Date().toISOString(),
  };
  const next = { ...data, sales: [...data.sales, sale] };
  savePosData(next);
  return { data: next, sale };
}

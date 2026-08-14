import type { PosData, Product } from "./types";

export const DEFAULT_PRODUCTS: Product[] = [
  { id: "p1", name: "চাল", price: 70, cost: 62, unit: "কেজি", color: "#F5E6C8", barcode: "8801001" },
  { id: "p2", name: "আটা", price: 55, cost: 48, unit: "কেজি", color: "#FAF0E6", barcode: "8801002" },
  { id: "p3", name: "মসুর ডাল", price: 140, cost: 125, unit: "কেজি", color: "#E67E22", barcode: "8801003" },
  { id: "p4", name: "সয়াবিন তেল", price: 180, cost: 165, unit: "লিটার", color: "#F4D03F", barcode: "8801004" },
  { id: "p5", name: "চিনি", price: 130, cost: 118, unit: "কেজি", color: "#FFFFFF", barcode: "8801005" },
  { id: "p6", name: "লবণ", price: 35, cost: 28, unit: "প্যাকেট", color: "#ECF0F1" },
  { id: "p7", name: "চা", price: 45, cost: 38, unit: "প্যাকেট", color: "#6E2C00" },
  { id: "p8", name: "বিস্কুট", price: 25, cost: 20, unit: "পিস", color: "#D4AC6A", barcode: "8801008" },
  { id: "p9", name: "সাবান", price: 40, cost: 32, unit: "পিস", color: "#85C1E9" },
  { id: "p10", name: "ডিটারজেন্ট", price: 90, cost: 75, unit: "প্যাকেট", color: "#3498DB" },
  { id: "p11", name: "নুডলস", price: 55, cost: 45, unit: "প্যাকেট", color: "#F39C12", barcode: "8801011" },
  { id: "p12", name: "ডিম", price: 55, cost: 48, unit: "হালি", color: "#FDEBD0" },
  { id: "p13", name: "পাউরুটি", price: 35, cost: 28, unit: "পিস", color: "#D7BDE2" },
  { id: "p14", name: "দুধ", price: 85, cost: 75, unit: "লিটার", color: "#FDFEFE", barcode: "8801014" },
  { id: "p15", name: "মসলা", price: 20, cost: 14, unit: "প্যাকেট", color: "#922B21" },
  { id: "p16", name: "হলুদ গুঁড়ো", price: 15, cost: 10, unit: "প্যাকেট", color: "#F1C40F", barcode: "8801016" },
  { id: "p17", name: "মরিচ গুঁড়ো", price: 15, cost: 10, unit: "প্যাকেট", color: "#C0392B", barcode: "8801017" },
  { id: "p18", name: "পেঁয়াজ", price: 60, cost: 50, unit: "কেজি", color: "#D5A6BD" },
  { id: "p19", name: "রসুন", price: 200, cost: 175, unit: "কেজি", color: "#F5F5DC" },
  { id: "p20", name: "আলু", price: 40, cost: 32, unit: "কেজি", color: "#D4AC0D" },
];

export const DEFAULT_SETTINGS: PosData["settings"] = {
  shopName: "আমার মুদি দোকান",
  adminPassword: "1234",
};

export const PRODUCT_COLOR_PRESETS = [
  "#F1C40F",
  "#E67E22",
  "#C0392B",
  "#3498DB",
  "#2ECC71",
  "#9B59B6",
  "#FFFFFF",
  "#F5E6C8",
  "#6E2C00",
  "#1C2833",
];

/** Strip legacy bracket suffixes like "(১ কেজি)" from product names. */
export function cleanProductName(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

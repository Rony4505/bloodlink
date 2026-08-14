import type { PosData, Product } from "./types";

export const DEFAULT_PRODUCTS: Product[] = [
  { id: "p1", name: "চাল (১ কেজি)", price: 70, unit: "কেজি", color: "#F5E6C8", barcode: "8801001" },
  { id: "p2", name: "আটা (১ কেজি)", price: 55, unit: "কেজি", color: "#FAF0E6", barcode: "8801002" },
  { id: "p3", name: "মসুর ডাল (১ কেজি)", price: 140, unit: "কেজি", color: "#E67E22", barcode: "8801003" },
  { id: "p4", name: "সয়াবিন তেল (১ লিটার)", price: 180, unit: "লিটার", color: "#F4D03F", barcode: "8801004" },
  { id: "p5", name: "চিনি (১ কেজি)", price: 130, unit: "কেজি", color: "#FFFFFF", barcode: "8801005" },
  { id: "p6", name: "লবণ", price: 35, unit: "প্যাকেট", color: "#ECF0F1" },
  { id: "p7", name: "চা (২৫০ গ্রাম)", price: 45, unit: "প্যাকেট", color: "#6E2C00" },
  { id: "p8", name: "বিস্কুট", price: 25, unit: "পিস", color: "#D4AC6A", barcode: "8801008" },
  { id: "p9", name: "সাবান", price: 40, unit: "পিস", color: "#85C1E9" },
  { id: "p10", name: "ডিটারজেন্ট", price: 90, unit: "প্যাকেট", color: "#3498DB" },
  { id: "p11", name: "নুডলস (৫০০ গ্রাম)", price: 55, unit: "প্যাকেট", color: "#F39C12", barcode: "8801011" },
  { id: "p12", name: "ডিম (১ হালি)", price: 55, unit: "হালি", color: "#FDEBD0" },
  { id: "p13", name: "পাউরুটি", price: 35, unit: "পিস", color: "#D7BDE2" },
  { id: "p14", name: "দুধ (১ লিটার)", price: 85, unit: "লিটার", color: "#FDFEFE", barcode: "8801014" },
  { id: "p15", name: "মসলা (৫০ গ্রাম)", price: 20, unit: "প্যাকেট", color: "#922B21" },
  { id: "p16", name: "হলুদ গুঁড়ো", price: 15, unit: "প্যাকেট", color: "#F1C40F", barcode: "8801016" },
  { id: "p17", name: "মরিচ গুঁড়ো", price: 15, unit: "প্যাকেট", color: "#C0392B", barcode: "8801017" },
  { id: "p18", name: "পেঁয়াজ (১ কেজি)", price: 60, unit: "কেজি", color: "#D5A6BD" },
  { id: "p19", name: "রসুন (১ কেজি)", price: 200, unit: "কেজি", color: "#F5F5DC" },
  { id: "p20", name: "আলু (১ কেজি)", price: 40, unit: "কেজি", color: "#D4AC0D" },
];

export const DEFAULT_SETTINGS: PosData["settings"] = {
  shopName: "আমার মুদি দোকান",
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

import type { PosData } from "./types";

export const DEFAULT_PRODUCTS: PosData["products"] = [
  { id: "p1", name: "চাল (১ কেজি)", price: 70, unit: "কেজি" },
  { id: "p2", name: "আটা (১ কেজি)", price: 55, unit: "কেজি" },
  { id: "p3", name: "মসুর ডাল (১ কেজি)", price: 140, unit: "কেজি" },
  { id: "p4", name: "সয়াবিন তেল (১ লিটার)", price: 180, unit: "লিটার" },
  { id: "p5", name: "চিনি (১ কেজি)", price: 130, unit: "কেজি" },
  { id: "p6", name: "লবণ", price: 35, unit: "প্যাকেট" },
  { id: "p7", name: "চা (২৫০ গ্রাম)", price: 45, unit: "প্যাকেট" },
  { id: "p8", name: "বিস্কুট", price: 25, unit: "পিস" },
  { id: "p9", name: "সাবান", price: 40, unit: "পিস" },
  { id: "p10", name: "ডিটারজেন্ট", price: 90, unit: "প্যাকেট" },
  { id: "p11", name: "নুডলস (৫০০ গ্রাম)", price: 55, unit: "প্যাকেট" },
  { id: "p12", name: "ডিম (১ হালি)", price: 55, unit: "হালি" },
  { id: "p13", name: "পাউরুটি", price: 35, unit: "পিস" },
  { id: "p14", name: "দুধ (১ লিটার)", price: 85, unit: "লিটার" },
  { id: "p15", name: "মসলা (৫০ গ্রাম)", price: 20, unit: "প্যাকেট" },
  { id: "p16", name: "হলুদ গুঁড়ো", price: 15, unit: "প্যাকেট" },
  { id: "p17", name: "মরিচ গুঁড়ো", price: 15, unit: "প্যাকেট" },
  { id: "p18", name: "পেঁয়াজ (১ কেজি)", price: 60, unit: "কেজি" },
  { id: "p19", name: "রসুন (১ কেজি)", price: 200, unit: "কেজি" },
  { id: "p20", name: "আলু (১ কেজি)", price: 40, unit: "কেজি" },
];

export const DEFAULT_SETTINGS: PosData["settings"] = {
  shopName: "আমার মুদি দোকান",
};

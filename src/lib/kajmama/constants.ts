import type { Category } from "./types";

export const KAJMAMA_BASE = "/kajmama";
export const DEMO_PASSWORD = "123456";
export const DEFAULT_OWNER_PIN = "1122";
export const COMMISSION_PCT = 10;

export const CATEGORIES: Category[] = [
  {
    id: "electrician",
    nameBn: "ইলেকট্রিশিয়ান",
    nameEn: "Electrician",
    blurbBn: "ওয়্যারিং, ফ্যান, বোর্ড, লাইট",
    blurbEn: "Wiring, fans, boards, lights",
    icon: "⚡",
  },
  {
    id: "plumber",
    nameBn: "প্লাম্বার",
    nameEn: "Plumber",
    blurbBn: "লিক, কমোড, ওয়াশবেসিন, পাইপ",
    blurbEn: "Leaks, toilets, basins, pipes",
    icon: "🔧",
  },
  {
    id: "ac",
    nameBn: "এসি সার্ভিস",
    nameEn: "AC service",
    blurbBn: "সার্ভিসিং, গ্যাস, ইনস্টল",
    blurbEn: "Service, gas, install",
    icon: "❄️",
  },
  {
    id: "painter",
    nameBn: "রংমিস্ত্রি",
    nameEn: "Painter",
    blurbBn: "ঘর-দেয়াল রং, পুটি, পলিশ",
    blurbEn: "Walls, putty, polish",
    icon: "🎨",
  },
  {
    id: "carpenter",
    nameBn: "কাঠমিস্ত্রি",
    nameEn: "Carpenter",
    blurbBn: "দরজা, আলমারি, ফিটিং",
    blurbEn: "Doors, cabinets, fittings",
    icon: "🪚",
  },
  {
    id: "mason",
    nameBn: "রাজমিস্ত্রি",
    nameEn: "Mason",
    blurbBn: "টাইলস, প্লাস্টার, মেরামত",
    blurbEn: "Tiles, plaster, repair",
    icon: "🧱",
  },
  {
    id: "cleaning",
    nameBn: "ক্লিনিং",
    nameEn: "Cleaning",
    blurbBn: "বাড়ি, অফিস, ডীপ ক্লিন",
    blurbEn: "Home, office, deep clean",
    icon: "✨",
  },
  {
    id: "cook",
    nameBn: "রাঁধুনি",
    nameEn: "Cook",
    blurbBn: "ঘরোয়া রান্না, পার্টি",
    blurbEn: "Home cooking, parties",
    icon: "🍳",
  },
  {
    id: "driver",
    nameBn: "ড্রাইভার",
    nameEn: "Driver",
    blurbBn: "ব্যক্তিগত, অফিস, ভাড়া",
    blurbEn: "Personal, office, hire",
    icon: "🚗",
  },
  {
    id: "tutor",
    nameBn: "গৃহশিক্ষক",
    nameEn: "Tutor",
    blurbBn: "স্কুল-কলেজ, ভর্তি",
    blurbEn: "School, college, admission",
    icon: "📚",
  },
  {
    id: "mechanic",
    nameBn: "গাড়ি মেকানিক",
    nameEn: "Mechanic",
    blurbBn: "সার্ভিস, ইঞ্জিন, ইলেকট্রিক",
    blurbEn: "Service, engine, electric",
    icon: "🛠️",
  },
  {
    id: "sewing",
    nameBn: "সেলাই",
    nameEn: "Tailor",
    blurbBn: "কাটিং, ফিটিং, অল্টার",
    blurbEn: "Cut, fit, alter",
    icon: "🧵",
  },
];

export const DISTRICTS = [
  "ঢাকা",
  "গাজীপুর",
  "নারায়ণগঞ্জ",
  "চট্টগ্রাম",
  "সিলেট",
  "খুলনা",
  "রাজশাহী",
  "রংপুর",
  "বরিশাল",
  "কুমিল্লা",
  "ময়মনসিংহ",
  "কক্সবাজার",
];

export function categoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

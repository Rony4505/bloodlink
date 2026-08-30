import type { Category, PackagePlan } from "./types";

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

export function categoryById(id: string, list: Category[] = CATEGORIES): Category | undefined {
  return list.find((c) => c.id === id);
}

export const DEFAULT_PACKAGES: PackagePlan[] = [
  {
    id: "basic",
    nameBn: "বেসিক",
    nameEn: "Basic",
    price: 0,
    durationDays: 0,
    premium: false,
    featuresBn: ["বেসিক লিস্টিং", "টপ সার্চ নয়", "প্রিমিয়াম ব্যাজ নয়"],
    featuresEn: ["Basic listing", "No top search", "No premium badge"],
    active: true,
  },
  {
    id: "monthly",
    nameBn: "প্রিমিয়াম মাসিক",
    nameEn: "Premium monthly",
    price: 299,
    durationDays: 30,
    premium: true,
    featuresBn: ["টপ সার্চ প্রাধান্য", "প্রিমিয়াম ব্যাজ", "৩টি ছবি"],
    featuresEn: ["Top search", "Premium badge", "Up to 3 photos"],
    active: true,
  },
  {
    id: "yearly",
    nameBn: "প্রিমিয়াম বাৎসরিক",
    nameEn: "Premium yearly",
    price: 2499,
    durationDays: 365,
    premium: true,
    featuresBn: ["মাসিকের সব সুবিধা", "হোমপেজে ফিচার"],
    featuresEn: ["Everything in monthly", "Homepage feature"],
    active: true,
  },
];

export const DEFAULT_ADMIN_BANKS = [
  {
    id: "bank_dbbl",
    bankName: "Dutch-Bangla Bank",
    accountName: "KajMama BD",
    accountNumber: "101-234-567890",
    branch: "Dhanmondi",
  },
];

export const DEFAULT_ADMIN_MOBILES = [
  { id: "mob_bkash", type: "bkash" as const, number: "01712-345678", name: "KajMama BD" },
  { id: "mob_nagad", type: "nagad" as const, number: "01712-345678", name: "KajMama BD" },
];

export const DEFAULT_ADS = [
  {
    id: "ad_home_hero",
    title: "KajMama Premium",
    subtitle: "সার্চের উপরে থাকুন — বেশি কাজ পান",
    imageUrl:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1400&q=55",
    href: "/kajmama/register?role=worker",
    ctaBn: "প্রিমিয়াম নিন",
    ctaEn: "Go premium",
    placement: "home_hero" as const,
    active: true,
  },
  {
    id: "ad_workers_top",
    title: "বিজ্ঞাপন স্পট · প্রিমিয়াম",
    subtitle: "আপনার ব্যবসা এখানে — অ্যাডমিন যেখানে চান সেখানে সেট করে",
    imageUrl:
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1400&q=55",
    href: "/kajmama/register",
    ctaBn: "বিস্তারিত",
    ctaEn: "Learn more",
    placement: "workers_top" as const,
    active: true,
  },
  {
    id: "ad_jobs_top",
    title: "সাইটে পেমেন্ট, নিরাপদ কাজ",
    subtitle: "কাজের টাকা ওয়েবসাইটের মাধ্যমে — ফি কর্মী থেকে",
    imageUrl: "",
    href: "/kajmama/jobs/new",
    ctaBn: "কাজ দিন",
    ctaEn: "Post a job",
    placement: "jobs_top" as const,
    active: true,
  },
];

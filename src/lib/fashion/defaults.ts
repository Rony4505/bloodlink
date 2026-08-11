import type { Category, StoreSettings } from "./types";

export const defaultSettings: StoreSettings = {
  brandName: "Slowgun",
  brandTagline: "বাংলাদেশি নারীদের জন্য লাক্সারি ফ্যাশন",
  defaultMarkupPercent: 35,
  pricingMode: "markup",
  deliveryRules: [
    { id: "d1", district: "Dhaka", fee: 80, minOrderForFree: 7000, active: true },
    { id: "d2", district: "*", fee: 150, minOrderForFree: 10000, active: true },
  ],
  heroTitle: "সহজ luxury, refined style, modern Bangladesh.",
  heroSubtitle: "বাংলাদেশি নারীদের জন্য curated premium fashion destination",
  heroDescription:
    "Slowgun এমন একটি e-commerce experience যেখানে premium fabric, soft color palette, festive elegance, আর daily sophistication—সবকিছু একসাথে পাওয়া যায়।",
  contactEmail: "hello@slowgun.com",
  contactPhone: "+880 1XXX-XXXXXX",
  whatsapp: "8801700000000",
  footerText: "বাংলাদেশি নারীদের জন্য curated luxury fashion—effortless browsing, premium presentation, এবং trusted delivery experience।",
  aboutText:
    "Slowgun শুরু হয়েছিল একটি সহজ বিশ্বাস থেকে—premium fashion-এর experience বাংলাদেশি নারীদের কাছে সহজ ও elegant করে তোলা।",
  freeShippingNote: "নির্দিষ্ট অর্ডারে ফ্রি ডেলিভারি",
  showCouponsOnHome: true,
  promoBanners: [],
};

export const defaultCategories: Category[] = [
  {
    slug: "jamdani",
    title: "Luxury Jamdani",
    titleBn: "লাক্সারি জামদানি",
    subtitle: "ঐতিহ্য ও আধুনিক কাটের ফিউশন",
    accent: "from-[#f5e8dc] via-[#fffaf6] to-[#ead5c3]",
    description: "Hand-inspired jamdani textures and modern silhouettes.",
  },
  {
    slug: "festive",
    title: "Modest Festive Edit",
    titleBn: "মডেস্ট ফেস্টিভ এডিট",
    subtitle: "ঈদ, দাওয়াত, হলুদ, রিসেপশন",
    accent: "from-[#e6d7cf] via-[#f8efea] to-[#d9c0b3]",
    description: "Statement festive pieces with modest coverage.",
  },
  {
    slug: "daily",
    title: "Daily Elegance",
    titleBn: "ডেইলি এলিগেন্স",
    subtitle: "অফিস, ইউনিভার্সিটি, ক্যাফে ডে",
    accent: "from-[#efe4dd] via-[#fffaf7] to-[#e3d0c5]",
    description: "Effortless premium daywear.",
  },
];

import type { Category } from "./types";

export const categories: Category[] = [
  {
    slug: "jamdani",
    title: "Luxury Jamdani",
    titleBn: "লাক্সারি জামদানি",
    subtitle: "ঐতিহ্য ও আধুনিক কাটের ফিউশন",
    accent: "from-[#f5e8dc] via-[#fffaf6] to-[#ead5c3]",
    description:
      "Hand-inspired jamdani textures, soft festive tones, and modern silhouettes for elegant occasions.",
  },
  {
    slug: "festive",
    title: "Modest Festive Edit",
    titleBn: "মডেস্ট ফেস্টিভ এডিট",
    subtitle: "ঈদ, দাওয়াত, হলুদ, রিসেপশন",
    accent: "from-[#e6d7cf] via-[#f8efea] to-[#d9c0b3]",
    description:
      "Statement festive pieces with modest coverage, premium embellishment, and polished finishing.",
  },
  {
    slug: "daily",
    title: "Daily Elegance",
    titleBn: "ডেইলি এলিগেন্স",
    subtitle: "অফিস, ইউনিভার্সিটি, ক্যাফে ডে",
    accent: "from-[#efe4dd] via-[#fffaf7] to-[#e3d0c5]",
    description:
      "Effortless premium daywear with breathable fabrics, clean lines, and quiet luxury details.",
  },
];

export function getCategory(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug);
}

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
  heroCtaPrimaryLabel: "কালেকশন দেখুন",
  heroCtaPrimaryHref: "/collections",
  heroCtaSecondaryLabel: "ফিচার্ড প্রোডাক্ট",
  heroCtaSecondaryHref: "/collections",
  heroStat1Value: "150+",
  heroStat1Label: "কিউরেটেড লাক্সারি পিস",
  heroStat2Value: "৬৪ জেলা",
  heroStat2Label: "সারা দেশে ডেলিভারি",
  heroStat3Value: "4.9/5",
  heroStat3Label: "কাস্টমার রেটিং",
  contactEmail: "hello@slowgun.com",
  contactPhone: "+880 1XXX-XXXXXX",
  whatsapp: "8801700000000",
  supportNote: "Dhaka delivery + nationwide courier",
  facebookUrl: "",
  instagramUrl: "",
  footerText:
    "বাংলাদেশি নারীদের জন্য curated luxury fashion—effortless browsing, premium presentation, এবং trusted delivery experience।",
  aboutTitle: "Luxury that feels natural for Bangladeshi women",
  aboutSubtitle: "Our story",
  aboutText:
    "Slowgun শুরু হয়েছিল একটি সহজ বিশ্বাস থেকে—premium fashion-এর experience বাংলাদেশি নারীদের কাছে সহজ ও elegant করে তোলা।",
  aboutPillars: [
    {
      title: "Curated, not crowded",
      body: "আমরা quantity-র চেয়ে quality, fabric feel, এবং styling clarity-তে focus করি।",
    },
    {
      title: "Bangladesh-first service",
      body: "COD, bKash, Nagad, Dhaka fast delivery, এবং nationwide courier support standard।",
    },
    {
      title: "Women-first experience",
      body: "Size guidance, styling help, festive packaging, এবং thoughtful post-purchase care।",
    },
  ],
  freeShippingNote: "নির্দিষ্ট অর্ডারে ফ্রি ডেলিভারি",
  announcementEnabled: false,
  announcementText: "",
  featuresTitle: "লাক্সারি জটিল হওয়ার দরকার নেই",
  featuresBody:
    "এই স্টোরের UI, product selection, payment options, এবং post-purchase communication—সবকিছু এমনভাবে সাজানো যাতে high-end shopping feel থাকে, কিন্তু ব্যবহার করা একদম সহজ হয়।",
  serviceHighlights: [
    "ঢাকা সিটিতে দ্রুত ডেলিভারি এবং সারা বাংলাদেশে কুরিয়ার সাপোর্ট",
    "Cash on Delivery, bKash, Nagad এবং কার্ড পেমেন্ট",
    "সাইজ গাইড, স্টাইলিং হেল্প, এবং WhatsApp কনসাল্টেশন",
    "গিফট বক্স, ফেস্টিভ প্যাকেজিং, এবং curated bundle offers",
  ],
  testimonials: [
    {
      quote:
        "ডিজাইনগুলো খুব ক্লিন, ফ্যাব্রিক প্রিমিয়াম, আর delivery experience সত্যিই polished লেগেছে।",
      author: "Nusrat, Dhanmondi",
    },
    {
      quote:
        "অনলাইনে luxury feel পাওয়া কঠিন, কিন্তু এই স্টোরের product curation আর presentation খুব confidence দেয়।",
      author: "Fariha, Chattogram",
    },
    {
      quote:
        "Festive shopping-এর জন্য one-stop solution মনে হয়েছে। Size support আর packaging দুটোই excellent.",
      author: "Mahi, Sylhet",
    },
  ],
  faqs: [
    {
      question: "সাইজ ঠিকমতো বুঝবো কীভাবে?",
      answer:
        "প্রতিটি প্রোডাক্টের সাথে detailed size chart, fabric note, এবং fitting suggestion দেওয়া আছে। চাইলে WhatsApp styling support-ও পাওয়া যাবে।",
    },
    {
      question: "রিটার্ন বা এক্সচেঞ্জ আছে?",
      answer:
        "ডেলিভারির ৩ দিনের মধ্যে size exchange support থাকবে, আর damaged item হলে priority replacement করা হবে।",
    },
    {
      question: "বিয়ের/ফেস্টিভ collections কি custom order করা যাবে?",
      answer:
        "হ্যাঁ, selected festive pieces-এর জন্য custom measurement consultation এবং preorder slot রাখা হয়েছে।",
    },
  ],
  showCouponsOnHome: true,
  showNewProducts: true,
  showOffers: true,
  showFeatures: true,
  showTestimonials: true,
  showFaq: true,
  metaTitle: "Slowgun — Luxury fashion for Bangladeshi women",
  metaDescription:
    "Premium jamdani, festive, and daily elegance collections with nationwide delivery across Bangladesh.",
  promoBanners: [],
  availableSizes: ["XS", "S", "M", "L", "XL", "XXL", "Free Size"],
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

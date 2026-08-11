import Link from "next/link";
import { FashionFooter } from "@/components/fashion/FashionFooter";
import { FashionHeader } from "@/components/fashion/FashionHeader";
import { HomeProductBrowse } from "@/components/fashion/HomeProductBrowse";
import { PromoCarousel } from "@/components/fashion/PromoCarousel";
import { buildCarouselSlides } from "@/lib/fashion/carousel-slides";
import { getCategories } from "@/lib/fashion/categories-server";
import { copy } from "@/lib/fashion/copy";
import {
  getActiveOffers,
  getActivePromoBanners,
  getNewProducts,
  getStoreSettings,
  listProducts,
  listPublicCoupons,
} from "@/lib/fashion/store";

const serviceHighlights = [
  "ঢাকা সিটিতে দ্রুত ডেলিভারি এবং সারা বাংলাদেশে কুরিয়ার সাপোর্ট",
  "Cash on Delivery, bKash, Nagad এবং কার্ড পেমেন্ট",
  "সাইজ গাইড, স্টাইলিং হেল্প, এবং WhatsApp কনসাল্টেশন",
  "গিফট বক্স, ফেস্টিভ প্যাকেজিং, এবং curated bundle offers",
];

const testimonials = [
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
];

const faqs = [
  {
    q: "সাইজ ঠিকমতো বুঝবো কীভাবে?",
    a: "প্রতিটি প্রোডাক্টের সাথে detailed size chart, fabric note, এবং fitting suggestion দেওয়া আছে। চাইলে WhatsApp styling support-ও পাওয়া যাবে।",
  },
  {
    q: "রিটার্ন বা এক্সচেঞ্জ আছে?",
    a: "ডেলিভারির ৩ দিনের মধ্যে size exchange support থাকবে, আর damaged item হলে priority replacement করা হবে।",
  },
  {
    q: "বিয়ের/ফেস্টিভ collections কি custom order করা যাবে?",
    a: "হ্যাঁ, selected festive pieces-এর জন্য custom measurement consultation এবং preorder slot রাখা হয়েছে।",
  },
];

export async function FashionHomePage() {
  const [offers, newProducts, settings, banners, coupons, categories, products] =
    await Promise.all([
      getActiveOffers(),
      getNewProducts(14),
      getStoreSettings(),
      getActivePromoBanners(),
      listPublicCoupons(),
      getCategories(),
      listProducts(),
    ]);

  const carouselSlides = buildCarouselSlides(banners, offers, newProducts);
  const displayCoupons = settings.showCouponsOnHome !== false ? coupons : [];

  return (
    <main className="min-h-screen bg-[#fffaf7] text-[#241815]">
      <section className="relative overflow-hidden border-b border-black/5 bg-[radial-gradient(circle_at_top_left,#fff6ef,transparent_35%),linear-gradient(135deg,#2c1d1a_0%,#4f342f_48%,#b88b74_100%)] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08),transparent_38%,rgba(255,255,255,0.12)_100%)]" />
        <div className="hero-orb pointer-events-none absolute -left-16 top-24 h-72 w-72 rounded-full bg-[#f4d4c2]/20 blur-3xl" />
        <div className="hero-drift pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#f8e5d6]/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-6 md:px-8 md:pb-24 md:pt-8">
          <FashionHeader variant="dark" />

          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-white/15 shadow-lg">
            <PromoCarousel slides={carouselSlides} coupons={displayCoupons} />
          </div>

          <div className="pt-14 md:pt-16">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/85 backdrop-blur">
              {settings.heroSubtitle ?? copy.tagline}
            </span>
            <h1 className="mt-6 max-w-3xl font-[family-name:var(--font-display)] text-5xl leading-tight font-bold md:text-7xl">
              {settings.heroTitle ?? "সহজ luxury, refined style, modern Bangladesh."}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/82 md:text-lg">
              {settings.heroDescription ??
                "Slowgun এমন একটি e-commerce experience যেখানে premium fabric, soft color palette, festive elegance, আর daily sophistication—সবকিছু একসাথে পাওয়া যায়।"}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/collections"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#2d1f1b] transition hover:-translate-y-0.5"
              >
                Shop Collections
              </Link>
              <Link
                href="/products/noor-signature-silk-set"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/16"
              >
                View Featured Piece
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ["150+", "Curated luxury pieces"],
                ["64 জেলা", "Nationwide delivery reach"],
                ["4.9/5", "Client satisfaction rating"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-3xl border border-white/12 bg-white/10 px-5 py-5 backdrop-blur"
                >
                  <p className="font-[family-name:var(--font-display)] text-3xl font-bold">
                    {value}
                  </p>
                  <p className="mt-2 text-sm text-white/72">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <HomeProductBrowse
        categories={categories}
        products={products}
        newProducts={newProducts}
        offerProducts={offers}
      />

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] bg-[#2f211d] p-8 text-white shadow-[0_30px_90px_rgba(48,27,20,0.18)]">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-white/55">
              Why shoppers stay
            </p>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold">
              Luxury doesn&apos;t have to feel complicated
            </h2>
            <p className="mt-4 max-w-xl text-base leading-8 text-white/76">
              এই স্টোরের UI, product selection, payment options, এবং post-purchase
              communication—সবকিছু এমনভাবে সাজানো যাতে high-end shopping feel থাকে,
              কিন্তু ব্যবহার করা একদম সহজ হয়।
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {serviceHighlights.map((item) => (
              <div
                key={item}
                className="rounded-[1.75rem] border border-black/6 bg-[#fcf6f2] p-6 shadow-[0_18px_60px_rgba(48,27,20,0.05)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f0ddd2] text-lg text-[#8b6456]">
                  ✦
                </div>
                <p className="mt-5 text-base leading-8 text-[#60483f]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-black/5 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
          <div className="grid gap-5 lg:grid-cols-3">
            {testimonials.map((item) => (
              <blockquote
                key={item.author}
                className="rounded-[2rem] border border-black/6 bg-[#fdf8f4] p-7 shadow-[0_20px_70px_rgba(48,27,20,0.05)]"
              >
                <p className="text-lg leading-8 text-[#513b33]">&ldquo;{item.quote}&rdquo;</p>
                <footer className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-[#9b7766]">
                  {item.author}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-[#9b7766]">
              FAQ
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold md:text-5xl">
              Simple support for premium shopping
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((item) => (
              <article
                key={item.q}
                className="rounded-[1.75rem] border border-black/6 bg-white p-6 shadow-[0_18px_60px_rgba(48,27,20,0.04)]"
              >
                <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold">
                  {item.q}
                </h3>
                <p className="mt-3 text-base leading-8 text-[#634b42]">{item.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <FashionFooter />
    </main>
  );
}

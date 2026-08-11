"use client";

import Link from "next/link";
import { useFashionCopy } from "@/lib/fashion/use-fashion-copy";

const serviceHighlights = {
  bn: [
    "ঢাকা সিটিতে দ্রুত ডেলিভারি এবং সারা বাংলাদেশে কুরিয়ার সাপোর্ট",
    "Cash on Delivery, bKash, Nagad এবং কার্ড পেমেন্ট",
    "সাইজ গাইড, স্টাইলিং হেল্প, এবং WhatsApp কনসাল্টেশন",
    "গিফট বক্স, ফেস্টিভ প্যাকেজিং, এবং curated bundle offers",
  ],
  en: [
    "Fast Dhaka delivery and nationwide courier support",
    "Cash on Delivery, bKash, Nagad and card payments",
    "Size guide, styling help, and WhatsApp consultation",
    "Gift boxes, festive packaging, and curated bundle offers",
  ],
};

const testimonials = {
  bn: [
    {
      quote: "ডিজাইনগুলো খুব ক্লিন, ফ্যাব্রিক প্রিমিয়াম, আর delivery experience সত্যিই polished লেগেছে।",
      author: "Nusrat, Dhanmondi",
    },
    {
      quote: "অনলাইনে luxury feel পাওয়া কঠিন, কিন্তু এই স্টোরের product curation আর presentation খুব confidence দেয়।",
      author: "Fariha, Chattogram",
    },
    {
      quote: "Festive shopping-এর জন্য one-stop solution মনে হয়েছে। Size support আর packaging দুটোই excellent.",
      author: "Mahi, Sylhet",
    },
  ],
  en: [
    {
      quote: "The designs feel clean, fabrics are premium, and the delivery experience is truly polished.",
      author: "Nusrat, Dhanmondi",
    },
    {
      quote: "Luxury online is hard to find, but this store's curation and presentation give real confidence.",
      author: "Fariha, Chattogram",
    },
    {
      quote: "It felt like a one-stop festive solution. Size support and packaging were both excellent.",
      author: "Mahi, Sylhet",
    },
  ],
};

const faqs = {
  bn: [
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
  ],
  en: [
    {
      q: "How do I choose the right size?",
      a: "Every product includes a detailed size chart, fabric notes, and fitting suggestions. WhatsApp styling support is also available.",
    },
    {
      q: "Do you offer returns or exchanges?",
      a: "Size exchange is available within 3 days of delivery, and damaged items get priority replacement.",
    },
    {
      q: "Can festive collections be custom ordered?",
      a: "Yes — selected festive pieces include custom measurement consultation and preorder slots.",
    },
  ],
};

export function HomeHeroActions({
  heroSubtitle,
  heroTitle,
  heroDescription,
}: {
  heroSubtitle: string;
  heroTitle: string;
  heroDescription: string;
}) {
  const { locale, fc } = useFashionCopy();

  return (
    <div className="pt-14 md:pt-16">
      <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/85 backdrop-blur">
        {heroSubtitle}
      </span>
      <h1 className="mt-6 max-w-3xl font-[family-name:var(--font-display)] text-5xl leading-tight font-bold md:text-7xl">
        {heroTitle}
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-8 text-white/82 md:text-lg">{heroDescription}</p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/collections"
          className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#2d1f1b] transition hover:-translate-y-0.5"
        >
          {fc.actions.shopCollections}
        </Link>
        <Link
          href="/products/noor-signature-silk-set"
          className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/16"
        >
          {fc.actions.viewFeatured}
        </Link>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          ["150+", fc.home.curatedPieces],
          [locale === "bn" ? "৬৪ জেলা" : "64 districts", fc.home.nationwide],
          ["4.9/5", fc.home.rating],
        ].map(([value, label]) => (
          <div key={label} className="rounded-3xl border border-white/12 bg-white/10 px-5 py-5 backdrop-blur">
            <p className="font-[family-name:var(--font-display)] text-3xl font-bold">{value}</p>
            <p className="mt-2 text-sm text-white/72">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HomeLowerSections() {
  const { locale, fc } = useFashionCopy();
  const highlights = serviceHighlights[locale];
  const quotes = testimonials[locale];
  const faqItems = faqs[locale];

  return (
    <>
      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] bg-[#2f211d] p-8 text-white shadow-[0_30px_90px_rgba(48,27,20,0.18)]">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-white/55">{fc.home.whyStay}</p>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold">{fc.home.featuresTitle}</h2>
            <p className="mt-4 max-w-xl text-base leading-8 text-white/76">{fc.home.featuresBody}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {highlights.map((item) => (
              <div key={item} className="rounded-[1.75rem] border border-black/6 bg-[#fcf6f2] p-6 shadow-[0_18px_60px_rgba(48,27,20,0.05)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f0ddd2] text-lg text-[#8b6456]">✦</div>
                <p className="mt-5 text-base leading-8 text-[#60483f]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-black/5 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
          <div className="grid gap-5 lg:grid-cols-3">
            {quotes.map((item) => (
              <blockquote key={item.author} className="rounded-[2rem] border border-black/6 bg-[#fdf8f4] p-7 shadow-[0_20px_70px_rgba(48,27,20,0.05)]">
                <p className="text-lg leading-8 text-[#513b33]">&ldquo;{item.quote}&rdquo;</p>
                <footer className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-[#9b7766]">{item.author}</footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-[#9b7766]">{fc.home.faq}</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold md:text-5xl">{fc.home.faqTitle}</h2>
          </div>
          <div className="space-y-4">
            {faqItems.map((item) => (
              <article key={item.q} className="rounded-[1.75rem] border border-black/6 bg-white p-6 shadow-[0_18px_60px_rgba(48,27,20,0.04)]">
                <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold">{item.q}</h3>
                <p className="mt-3 text-base leading-8 text-[#634b42]">{item.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

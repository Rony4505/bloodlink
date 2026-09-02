"use client";

import Link from "next/link";
import { localeEyebrowClass } from "@/lib/fashion/locale-text-style";
import { useFashionCopy } from "@/lib/fashion/use-fashion-copy";
import { tSetting } from "@/lib/fashion/locale-settings";
import type { FaqItem, StoreSettings } from "@/lib/fashion/types";

export function HomeHeroActions({
  settings,
}: {
  settings: StoreSettings;
}) {
  const { locale, fc } = useFashionCopy();

  const heroSubtitle = tSetting(settings, "heroSubtitle", "heroSubtitleEn", locale, fc.home.categoryHint);
  const heroTitle = tSetting(
    settings,
    "heroTitle",
    "heroTitleEn",
    locale,
    "প্রিমিয়াম ফ্যাশন, আপনার স্টাইলে।",
  );
  const heroDescription = tSetting(settings, "heroDescription", "heroDescriptionEn", locale, "");
  const primaryLabel = tSetting(
    settings,
    "heroCtaPrimaryLabel",
    "heroCtaPrimaryLabelEn",
    locale,
    fc.actions.shopCollections,
  );
  const primaryHref = settings.heroCtaPrimaryHref || "/collections";
  const secondaryLabel = tSetting(
    settings,
    "heroCtaSecondaryLabel",
    "heroCtaSecondaryLabelEn",
    locale,
    fc.actions.viewFeatured,
  );
  const secondaryHref = settings.heroCtaSecondaryHref || "/collections";

  return (
    <div className="pt-14 md:pt-16">
      <span className="inline-flex rounded-full border border-[#dccde0]/70 bg-white/70 px-4 py-2 text-sm font-medium text-[#6e5870] backdrop-blur">
        {heroSubtitle}
      </span>
      <h1 className="mt-6 max-w-3xl font-[family-name:var(--font-display)] text-5xl leading-tight font-bold text-[#4a3348] md:text-7xl">
        {heroTitle}
      </h1>
      {heroDescription ? (
        <p className="mt-6 max-w-2xl text-base leading-8 text-[#6e5870] md:text-lg">{heroDescription}</p>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href={primaryHref}
          className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#9d6b8a,#c9a0b8)] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:opacity-95"
        >
          {primaryLabel || (locale === "bn" ? "কালেকশন দেখুন" : "Shop collections")}
        </Link>
        <Link
          href={secondaryHref}
          className="inline-flex items-center justify-center rounded-full border-2 border-[#e8b896] bg-white/85 px-6 py-3 text-sm font-semibold text-[#5c3d5e] shadow-sm transition hover:bg-[#faf0f5]"
        >
          {secondaryLabel || (locale === "bn" ? "ফিচার্ড প্রোডাক্ট" : "Featured product")}
        </Link>
      </div>
    </div>
  );
}

export function HomeStatsStrip({ settings }: { settings: StoreSettings }) {
  const { locale, fc } = useFashionCopy();
  const stats = [
    [
      settings.heroStat1Value || "150+",
      tSetting(settings, "heroStat1Label", "heroStat1LabelEn", locale, fc.home.curatedPieces),
    ],
    [
      settings.heroStat2Value || (locale === "bn" ? "৬৪ জেলা" : "64 districts"),
      tSetting(settings, "heroStat2Label", "heroStat2LabelEn", locale, fc.home.nationwide),
    ],
    [
      settings.heroStat3Value || "4.9/5",
      tSetting(settings, "heroStat3Label", "heroStat3LabelEn", locale, fc.home.rating),
    ],
  ];

  return (
    <section className="border-b border-black/5 bg-[#f7f7f5]">
      <div className="mx-auto grid max-w-7xl gap-4 px-5 py-10 sm:grid-cols-3 md:px-8 md:py-12">
        {stats.map(([value, label]) => (
          <div
            key={label}
            className="rounded-[1.5rem] border border-black/6 bg-white px-5 py-6 text-center shadow-[0_12px_40px_rgba(48,27,20,0.04)]"
          >
            <p className="font-[family-name:var(--font-display)] text-3xl font-bold text-[#5c3d5e]">
              {value}
            </p>
            <p className="mt-2 text-sm text-[#6e5449]">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HomeLowerSections({ settings }: { settings: StoreSettings }) {
  const { locale, fc } = useFashionCopy();

  const highlights =
    locale === "en"
      ? (settings.serviceHighlightsEn?.filter(Boolean).length
          ? settings.serviceHighlightsEn.filter(Boolean)
          : settings.serviceHighlights?.filter(Boolean) ?? [])
      : (settings.serviceHighlights?.filter(Boolean) ?? []);

  const faqItems: FaqItem[] =
    locale === "en"
      ? (settings.faqsEn?.filter((f) => f.question.trim()).length
          ? settings.faqsEn.filter((f) => f.question.trim())
          : settings.faqs?.filter((f) => f.question.trim()) ?? [])
      : (settings.faqs?.filter((f) => f.question.trim()) ?? []);

  const featuresTitle = tSetting(
    settings,
    "featuresTitle",
    "featuresTitleEn",
    locale,
    fc.home.featuresTitle,
  );
  const featuresBody = tSetting(
    settings,
    "featuresBody",
    "featuresBodyEn",
    locale,
    fc.home.featuresBody,
  );

  return (
    <>
      {settings.showFeatures !== false ? (
        <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[2rem] border border-[#e8d4e8]/60 bg-[linear-gradient(145deg,#fdf8f5,#f5e8f0_55%,#ebe0f5)] p-8 text-[#4a3348] shadow-[0_30px_90px_rgba(122,85,128,0.08)]">
              <p className={localeEyebrowClass(locale, "text-sm font-medium text-[#9d6b8a]")}>
                {fc.home.whyStay}
              </p>
              <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold text-[#5c3d5e]">
                {featuresTitle}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-8 text-[#6e5870]">{featuresBody}</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {highlights.map((item) => (
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
      ) : null}

      {settings.showFaq !== false && faqItems.length > 0 ? (
        <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className={localeEyebrowClass(locale)}>
                {fc.home.faq}
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold md:text-5xl">
                {fc.home.faqTitle}
              </h2>
            </div>
            <div className="space-y-4">
              {faqItems.map((item) => (
                <article
                  key={item.question}
                  className="rounded-[1.75rem] border border-black/6 bg-white p-6 shadow-[0_18px_60px_rgba(48,27,20,0.04)]"
                >
                  <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold">
                    {item.question}
                  </h3>
                  <p className="mt-3 text-base leading-8 text-[#634b42]">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

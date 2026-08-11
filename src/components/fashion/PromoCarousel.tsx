"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Coupon, Product } from "@/lib/fashion/types";
import { formatBdt } from "@/lib/fashion/format";
import { getEffectivePrice } from "@/lib/fashion/pricing";

export type CarouselSlide = {
  id: string;
  imageUrl: string;
  href: string;
  label?: string;
  badge?: string;
};

export function PromoCarousel({
  slides,
  coupons = [],
}: {
  slides: CarouselSlide[];
  coupons?: Coupon[];
}) {
  const [index, setIndex] = useState(0);
  const touchStart = useRef(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!slides.length && !coupons.length) return null;

  function go(delta: number) {
    if (!slides.length) return;
    setIndex((i) => (i + delta + slides.length) % slides.length);
  }

  return (
    <section className="border-b border-[#e8d4c4]/40 bg-[#faf4f0]">
      {slides.length > 0 ? (
        <div
          className="relative w-full overflow-hidden"
          onTouchStart={(e) => {
            touchStart.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            const diff = touchStart.current - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 40) go(diff > 0 ? 1 : -1);
          }}
        >
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {slides.map((slide) => (
              <Link
                key={slide.id}
                href={slide.href}
                className="relative block h-28 w-full shrink-0 sm:h-32 md:h-36"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${slide.imageUrl})` }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(43,29,25,0.35),transparent_55%)]" />
                {slide.badge ? (
                  <span className="absolute left-4 top-3 rounded-full bg-[#f4d4c2]/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#3d2a24]">
                    {slide.badge}
                  </span>
                ) : null}
                {slide.label ? (
                  <p className="absolute bottom-3 left-4 max-w-[70%] font-[family-name:var(--font-display)] text-lg font-bold text-white drop-shadow md:text-xl">
                    {slide.label}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>

          {slides.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 px-3 py-2 text-sm font-bold shadow-md"
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 px-3 py-2 text-sm font-bold shadow-md"
                aria-label="Next"
              >
                ›
              </button>
              <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-white" : "w-1.5 bg-white/50"}`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {coupons.length > 0 ? (
        <div className="mx-auto flex max-w-7xl gap-3 overflow-x-auto px-4 py-3 md:px-8">
          <span className="shrink-0 self-center text-xs font-semibold uppercase tracking-[0.2em] text-[#9b7766]">
            কুপন
          </span>
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className="shrink-0 rounded-full border border-[#e8c4b0]/50 bg-white px-4 py-2 text-sm font-semibold text-[#8f624e] shadow-sm"
            >
              {coupon.code} ·{" "}
              {coupon.discountType === "percent"
                ? `${coupon.discountValue}% ছাড়`
                : formatBdt(coupon.discountValue)}
              {coupon.expiresAt
                ? ` · ${new Date(coupon.expiresAt).toLocaleDateString("bn-BD")} পর্যন্ত`
                : ""}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function buildCarouselSlides(
  banners: { id: string; imageUrl: string; title?: string; linkSlug?: string; productId?: string }[],
  offers: Product[],
  newProducts: Product[],
): CarouselSlide[] {
  const slides: CarouselSlide[] = banners.map((b) => ({
    id: b.id,
    imageUrl: b.imageUrl,
    href: b.linkSlug ? `/products/${b.linkSlug}` : "/collections",
    label: b.title,
    badge: "অফার",
  }));

  for (const product of offers) {
    slides.push({
      id: `offer-${product.id}`,
      imageUrl: product.imageUrl,
      href: `/products/${product.slug}`,
      label: product.offerLabel ?? product.nameBn,
      badge: product.offerDiscountPercent ? `${product.offerDiscountPercent}% ছাড়` : "অফার",
    });
  }

  for (const product of newProducts.slice(0, 4)) {
    if (slides.some((s) => s.id === `offer-${product.id}`)) continue;
    slides.push({
      id: `new-${product.id}`,
      imageUrl: product.imageUrl,
      href: `/products/${product.slug}`,
      label: product.nameBn,
      badge: "নতুন",
    });
  }

  return slides;
}

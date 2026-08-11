"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CarouselSlide } from "@/lib/fashion/carousel-slides";
import type { Coupon, Product } from "@/lib/fashion/types";
import { formatBdt } from "@/lib/fashion/format";
import { useFashionCopy } from "@/lib/fashion/use-fashion-copy";

export function PromoCarousel({
  slides,
  coupons = [],
  products = [],
}: {
  slides: CarouselSlide[];
  coupons?: Coupon[];
  products?: Product[];
}) {
  const { locale, fc } = useFashionCopy();
  const [index, setIndex] = useState(0);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
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

  function couponProducts(coupon: Coupon) {
    if (!coupon.productIds?.length) return [];
    return products.filter((p) => coupon.productIds!.includes(p.id));
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
            {fc.couponLabel}
          </span>
          {coupons.map((coupon) => (
            <button
              key={coupon.id}
              type="button"
              onClick={() => setSelectedCoupon(coupon)}
              className="shrink-0 rounded-full border border-[#e8c4b0]/50 bg-white px-4 py-2 text-sm font-semibold text-[#8f624e] shadow-sm transition hover:bg-[#fff8f4]"
            >
              {coupon.code} ·{" "}
              {coupon.discountType === "percent"
                ? `${coupon.discountValue}%`
                : formatBdt(coupon.discountValue)}
            </button>
          ))}
        </div>
      ) : null}

      {selectedCoupon ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#2b1d19]/50 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[2rem] border border-[#e8c4b0]/60 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#9b7766]">
                  {fc.couponDetails}
                </p>
                <h3 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-[#8f624e]">
                  {selectedCoupon.code}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCoupon(null)}
                className="rounded-full bg-[#faf4f0] px-3 py-1 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-3 text-sm text-[#5b4339]">
              <p>
                <span className="font-semibold">{fc.couponDiscount}: </span>
                {selectedCoupon.discountType === "percent"
                  ? `${selectedCoupon.discountValue}%`
                  : formatBdt(selectedCoupon.discountValue)}
              </p>
              {selectedCoupon.description ? <p>{selectedCoupon.description}</p> : null}
              <p>
                <span className="font-semibold">{fc.couponValidUntil}: </span>
                {selectedCoupon.expiresAt
                  ? new Date(selectedCoupon.expiresAt).toLocaleDateString(
                      locale === "bn" ? "bn-BD" : "en-BD",
                      { year: "numeric", month: "long", day: "numeric" },
                    )
                  : fc.couponNoExpiry}
              </p>
              {selectedCoupon.minOrder ? (
                <p>
                  <span className="font-semibold">{fc.couponMinOrder}: </span>
                  {formatBdt(selectedCoupon.minOrder)}
                </p>
              ) : null}
              <div>
                <p className="font-semibold">{fc.couponProducts}</p>
                {selectedCoupon.productIds?.length ? (
                  <ul className="mt-2 space-y-1">
                    {couponProducts(selectedCoupon).map((p) => (
                      <li key={p.id}>
                        <Link href={`/products/${p.slug}`} className="text-[#8f624e] underline-offset-2 hover:underline">
                          {locale === "bn" ? p.nameBn : p.name}
                        </Link>
                      </li>
                    ))}
                    {couponProducts(selectedCoupon).length === 0 ? (
                      <li className="text-[#9b7766]">{selectedCoupon.productIds.length} product(s)</li>
                    ) : null}
                  </ul>
                ) : (
                  <p className="mt-1 text-[#6f554a]">{fc.couponAllProducts}</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedCoupon(null)}
              className="mt-6 w-full rounded-full bg-[linear-gradient(135deg,#e8b896,#f4d4c2)] px-6 py-3 text-sm font-semibold text-[#3d2a24]"
            >
              {fc.close}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

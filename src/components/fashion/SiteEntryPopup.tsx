"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { copy } from "@/lib/fashion/copy";
import { formatBdt } from "@/lib/fashion/format";
import type { Coupon, Product } from "@/lib/fashion/types";

type PopupData = {
  offers: Product[];
  newProducts: Product[];
  coupons: Coupon[];
  promoFingerprint: string;
};

function buildFingerprint(payload: {
  offers?: Product[];
  newProducts?: Product[];
  coupons?: Coupon[];
  banners?: { id: string }[];
}): string {
  const parts = [
    ...(payload.coupons ?? []).map((c) => `c:${c.id}:${c.code}`),
    ...(payload.offers ?? []).map((p) => `o:${p.id}`),
    ...(payload.newProducts ?? []).filter((p) => p.offerActive).map((p) => `p:${p.id}`),
    ...(payload.banners ?? []).map((b) => `b:${b.id}`),
  ];
  return parts.sort().join("|");
}

export function SiteEntryPopup() {
  const [data, setData] = useState<PopupData | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    fetch("/api/fashion/storefront")
      .then((r) => r.json())
      .then((payload) => {
        const offers = payload.offers ?? [];
        const newProducts = payload.newProducts ?? [];
        const coupons = payload.coupons ?? [];
        const promoFingerprint =
          payload.promoFingerprint ?? buildFingerprint({ ...payload, offers, newProducts, coupons });

        if (!offers.length && !newProducts.length && !coupons.length) return;

        const seen = localStorage.getItem("scc_popup_fp");
        if (seen === promoFingerprint) return;

        setData({ offers, newProducts, coupons, promoFingerprint });
        setOpen(true);
        localStorage.setItem("scc_popup_fp", promoFingerprint);
      })
      .catch(() => undefined);
  }, []);

  if (!open || !data) return null;

  const productItems = [...data.offers, ...data.newProducts].slice(0, 3);
  const coupons = data.coupons.slice(0, 4);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
        <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-[#d4b896]/30 bg-[linear-gradient(165deg,#fffaf7,#f5e8dc)] p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9b7766]">
                Smart craft corner
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-[#2b1d19]">
                {copy.offers.popupTitle}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full bg-[#2b1d19]/8 px-3 py-1 text-sm font-semibold text-[#5b4339]"
            >
              {copy.actions.close}
            </button>
          </div>

          {coupons.length ? (
            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#9b7766]">
                Special Offer / Coupon
              </p>
              <div className="space-y-2">
                {coupons.map((coupon) => (
                  <button
                    key={coupon.id}
                    type="button"
                    onClick={() => setSelectedCoupon(coupon)}
                    className="flex w-full items-center justify-between rounded-2xl border border-[#e8c4b0]/60 bg-white/90 p-4 text-left transition hover:bg-white"
                  >
                    <div>
                      <p className="font-[family-name:var(--font-display)] text-xl font-bold text-[#8f624e]">
                        {coupon.code}
                      </p>
                      <p className="text-sm text-[#6f554a]">
                        {coupon.discountType === "percent"
                          ? `${coupon.discountValue}% ছাড়`
                          : `${formatBdt(coupon.discountValue)} ছাড়`}
                        {coupon.minOrder ? ` · ন্যূনতম ${formatBdt(coupon.minOrder)}` : ""}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-[#8f624e]">বিস্তারিত →</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {productItems.length ? (
            <div className={`space-y-3 ${coupons.length ? "mt-6 border-t border-black/6 pt-6" : "mt-6"}`}>
              {productItems.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-4 rounded-2xl border border-black/6 bg-white/80 p-3 transition hover:bg-white"
                >
                  <div
                    className="h-16 w-16 shrink-0 rounded-xl bg-cover bg-center"
                    style={{ backgroundImage: `url(${product.imageUrl})` }}
                  />
                  <div>
                    <p className="font-semibold text-[#2b1d19]">{product.nameBn}</p>
                    {product.offerActive ? (
                      <p className="text-sm text-[#8f624e]">
                        {product.offerLabel ?? "অফার"} · {product.offerDiscountPercent}% ছাড়
                      </p>
                    ) : (
                      <p className="text-sm text-[#8b6456]">নতুন প্রোডাক্ট</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {selectedCoupon ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-[#d4b896]/40 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#2b1d19]">
                {selectedCoupon.code}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedCoupon(null)}
                className="rounded-full bg-[#faf4f0] px-3 py-1 text-sm font-semibold"
              >
                ✕
              </button>
            </div>
            <p className="mt-3 text-lg font-semibold text-[#8f624e]">
              {selectedCoupon.discountType === "percent"
                ? `${selectedCoupon.discountValue}% ছাড়`
                : `${formatBdt(selectedCoupon.discountValue)} ছাড়`}
            </p>
            {selectedCoupon.description ? (
              <p className="mt-2 text-sm leading-7 text-[#6f554a]">{selectedCoupon.description}</p>
            ) : (
              <p className="mt-2 text-sm text-[#6f554a]">
                কার্টে কুপন কোড ব্যবহার করুন: <strong>{selectedCoupon.code}</strong>
              </p>
            )}
            {selectedCoupon.minOrder ? (
              <p className="mt-2 text-sm text-[#8b6456]">
                ন্যূনতম অর্ডার: {formatBdt(selectedCoupon.minOrder)}
              </p>
            ) : null}
            {selectedCoupon.expiresAt ? (
              <p className="mt-1 text-xs text-[#9b7766]">
                মেয়াদ: {new Date(selectedCoupon.expiresAt).toLocaleDateString("bn-BD")}
              </p>
            ) : null}
            <Link
              href="/collections"
              onClick={() => {
                setSelectedCoupon(null);
                setOpen(false);
              }}
              className="mt-5 inline-flex rounded-full bg-[#8f624e] px-5 py-3 text-sm font-semibold text-white"
            >
              কেনাকাটা শুরু করুন
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Product, StoreSettings } from "@/lib/fashion/types";
import { useCart } from "@/lib/fashion/cart-context";
import { getEffectivePrice } from "@/lib/fashion/pricing";
import { useFashionCopy } from "@/lib/fashion/use-fashion-copy";
import { copy } from "@/lib/fashion/copy";
import { formatBdt } from "@/lib/fashion/format";

function formatPhoneLink(raw?: string) {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return null;
  const normalized = digits.startsWith("880") ? digits : `880${digits.replace(/^0/, "")}`;
  return { tel: `tel:+${normalized}`, display: raw ?? normalized, wa: `https://wa.me/${normalized}` };
}

export function ProductOrderPanel({ product }: { product: Product }) {
  const router = useRouter();
  const { fc, locale } = useFashionCopy();
  const { addItem } = useCart();
  const [size, setSize] = useState(product.sizes[0] ?? "Free Size");
  const [quantity, setQuantity] = useState(1);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [added, setAdded] = useState(false);

  const price = getEffectivePrice(product);
  const inStock = product.stock > 0 && product.inStock;
  const title = locale === "bn" ? product.nameBn : product.name;
  const productCode = product.id.replace(/\D/g, "").slice(-8) || product.id.slice(-8);

  useEffect(() => {
    fetch("/api/fashion/settings")
      .then((r) => r.json())
      .then((data) => setSettings(data.settings ?? null))
      .catch(() => setSettings(null));
    fetch(`/api/fashion/reviews?productId=${product.id}`)
      .then((r) => r.json())
      .then((data) => {
        const reviews = data.reviews ?? [];
        setReviewCount(reviews.length);
        if (!reviews.length) {
          setAvgRating(0);
          return;
        }
        const sum = reviews.reduce((acc: number, r: { rating: number }) => acc + (r.rating || 0), 0);
        setAvgRating(sum / reviews.length);
      })
      .catch(() => {
        setAvgRating(0);
        setReviewCount(0);
      });
  }, [product.id]);

  const phone = useMemo(
    () => formatPhoneLink(settings?.adminPhone || settings?.contactPhone || settings?.whatsapp),
    [settings],
  );
  const whatsapp = useMemo(() => formatPhoneLink(settings?.whatsapp), [settings]);

  const deliveryNote = useMemo(() => {
    const rules = settings?.deliveryRules?.filter((r) => r.active) ?? [];
    const nationwide = rules.find((r) => r.district === "*");
    const dhaka = rules.find((r) => r.district === "Dhaka");
    const rateParts: string[] = [];
    if (dhaka?.fee != null) {
      rateParts.push(`ঢাকা ${formatBdt(dhaka.fee)}`);
    }
    if (nationwide?.fee != null) {
      rateParts.push(`অন্যান্য জেলা ${formatBdt(nationwide.fee)}`);
    }
    if (rateParts.length) {
      return `ডেলিভারি রেট (Admin সেটিং): ${rateParts.join(" · ")}। Checkout-এ delivery area select করলে exact charge যোগ হবে — area select না করলে ৳0 দেখাবে।`;
    }
    return settings?.supportNote || copy.cart.freeShipping;
  }, [settings]);

  function addToCart(redirect?: "checkout") {
    if (!inStock || quantity > product.stock) return;
    addItem({ ...product, price }, size, product.colors[0]?.name ?? "Default", quantity);
    if (redirect === "checkout") {
      router.push("/checkout");
      return;
    }
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 text-sm text-[#8a7490]">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < Math.round(avgRating) ? "text-[#c9852d]" : "text-[#ddd0d8]"}>
            ★
          </span>
        ))}
        <span className="ml-1 font-semibold text-[#5c3d5e]">
          {reviewCount ? `${avgRating.toFixed(2)}/5` : "0.00/5"}
        </span>
        <a href="#reviews" className="ml-2 underline-offset-2 hover:underline">
          See Reviews
        </a>
      </div>

      <div className="relative overflow-hidden rounded-xl bg-[linear-gradient(135deg,#e8c4d8,#c9a0b8)] px-4 py-2.5 text-sm font-bold text-[#3d2440]">
        Product code : {productCode}
        <span className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-[linear-gradient(135deg,#c9a0b8,#b088a8)] [clip-path:polygon(100%_0,0_0,100%_100%)]" />
      </div>

      <div className="rounded-2xl border border-[#e8d4e8]/60 bg-[#f5f0f4] p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-[#2f6b4f]">
          <span aria-hidden>✓</span>
          {inStock
            ? `Available Stock: ${product.stock} ${fc.home.pieces} remaining`
            : fc.actions.outOfStock}
        </p>

        <p className="mt-4 text-sm font-bold text-[#5c3d5e]">Select Variant:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {product.sizes.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSize(option)}
              className={`min-w-11 rounded-lg border px-3 py-2 text-sm font-bold transition ${
                size === option
                  ? "border-[#5c3d5e] bg-white text-[#5c3d5e] shadow-sm"
                  : "border-[#e8d4e8]/70 bg-white/70 text-[#8a7490]"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm">
        <span className="font-bold text-[#4a3348]">Brand :</span>{" "}
        <span className="text-[#5c3d5e]">{settings?.brandName ?? copy.brand}</span>
      </p>

      <div>
        <div className="inline-flex items-center rounded-lg border border-[#e8d4e8]/70 bg-white">
          <button
            type="button"
            className="px-4 py-2 text-lg"
            onClick={() => setQuantity((v) => Math.max(1, v - 1))}
          >
            −
          </button>
          <span className="min-w-10 text-center text-sm font-bold">{quantity}</span>
          <button
            type="button"
            className="px-4 py-2 text-lg"
            onClick={() => setQuantity((v) => Math.min(product.stock, v + 1))}
            disabled={quantity >= product.stock}
          >
            +
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!inStock}
          onClick={() => addToCart()}
          className="rounded-xl bg-[linear-gradient(135deg,#9d6b8a,#c9a0b8)] px-4 py-3 text-sm font-bold text-white shadow-md disabled:opacity-50"
        >
          {added ? fc.actions.addedToCart : fc.actions.addToCart}
        </button>
        <button
          type="button"
          disabled={!inStock}
          onClick={() => addToCart("checkout")}
          className="rounded-xl bg-[#2b1d19] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          Buy Now
        </button>
      </div>

      {phone ? (
        <a
          href={phone.tel}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#5c3d5e] px-4 py-3 text-sm font-bold text-white"
        >
          📞 {phone.display}
        </a>
      ) : null}

      {whatsapp ? (
        <a
          href={`${whatsapp.wa}?text=${encodeURIComponent(`${title} — ${fc.actions.addToCart}?`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-[#5c3d5e] bg-white px-4 py-3 text-sm font-bold text-[#5c3d5e]"
        >
          💬 Ask about this product
        </a>
      ) : null}

      <div className="flex gap-3 rounded-xl border border-[#e8d4e8]/50 bg-[#faf0f5] px-4 py-3 text-sm leading-relaxed text-[#5c4860]">
        <span aria-hidden className="text-lg">📦</span>
        <p>{deliveryNote}</p>
      </div>
    </div>
  );
}

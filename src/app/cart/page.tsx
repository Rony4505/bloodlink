"use client";

import Link from "next/link";
import { FashionShell } from "@/components/fashion/FashionShell";
import { ProductImage } from "@/components/fashion/ProductImage";
import { CartOrderSection } from "@/components/fashion/CartOrderSection";
import { FashionButton } from "@/components/fashion/FashionButton";
import { copy } from "@/lib/fashion/copy";
import { formatBdt } from "@/lib/fashion/format";
import { useCart } from "@/lib/fashion/cart-context";

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem } = useCart();

  return (
    <FashionShell>
      <section className="mx-auto max-w-3xl px-5 py-14 md:px-8 md:py-20">
        <h1 className="font-[family-name:var(--font-display)] text-5xl font-bold md:text-6xl">
          {copy.cart.title}
        </h1>
        <p className="mt-2 text-sm text-[#8b6456]">
          কার্ট দেখুন → অর্ডার সারাংশ → নিচে অর্ডার কনফার্ম করুন
        </p>

        {items.length === 0 ? (
          <div className="mt-12 rounded-[2rem] border border-black/6 bg-white p-10 text-center shadow-[0_24px_80px_rgba(48,27,20,0.06)]">
            <p className="text-lg text-[#6f554a]">{copy.cart.empty}</p>
            <div className="mt-6">
              <FashionButton href="/collections">{copy.actions.continueShopping}</FashionButton>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-10 space-y-4">
              {items.map((item) => (
                <article
                  key={item.key}
                  className="grid gap-4 rounded-[2rem] border border-black/6 bg-white p-4 shadow-[0_24px_80px_rgba(48,27,20,0.06)] sm:grid-cols-[120px_1fr] sm:p-5"
                >
                  {item.imageUrl ? (
                    <ProductImage src={item.imageUrl} alt={item.name} className="h-28 sm:h-32" />
                  ) : (
                    <div className={`rounded-[1.5rem] ${item.tone} min-h-28 sm:min-h-32`} />
                  )}
                  <div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <Link
                          href={`/products/${item.slug}`}
                          className="font-[family-name:var(--font-display)] text-xl font-bold sm:text-2xl"
                        >
                          {item.name}
                        </Link>
                        <p className="mt-1 text-sm text-[#8b6456]">
                          সাইজ: {item.size} · রং: {item.color}
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-[#8f624e]">
                        {formatBdt(item.price * item.quantity)}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <div className="inline-flex items-center rounded-full border border-black/8 bg-[#faf4f0]">
                        <button type="button" className="px-4 py-2" onClick={() => updateQuantity(item.key, item.quantity - 1)}>−</button>
                        <span className="min-w-10 text-center text-sm font-semibold">{item.quantity}</span>
                        <button type="button" className="px-4 py-2" onClick={() => updateQuantity(item.key, item.quantity + 1)}>+</button>
                      </div>
                      <button type="button" className="text-sm font-semibold text-[#8b6456]" onClick={() => removeItem(item.key)}>
                        {copy.actions.delete}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <CartOrderSection subtotal={subtotal} />
          </>
        )}
      </section>
    </FashionShell>
  );
}

"use client";

import { AddToCartPanel } from "@/components/fashion/AddToCartPanel";
import { formatBdt } from "@/lib/fashion/format";
import { getEffectivePrice } from "@/lib/fashion/pricing";
import { useFashionCopy } from "@/lib/fashion/use-fashion-copy";
import type { Product } from "@/lib/fashion/types";

export function ProductPageDetails({
  product,
  categoryTitle,
}: {
  product: Product;
  categoryTitle?: string;
}) {
  const { locale, fc } = useFashionCopy();
  const price = getEffectivePrice(product);
  const originalPrice = product.offerActive ? product.price : product.compareAtPrice;
  const title = locale === "bn" ? product.nameBn : product.name;
  const subtitle = locale === "bn" ? product.name : product.nameBn;
  const description = locale === "bn" ? product.descriptionBn : product.description;

  return (
    <div>
      {product.offerActive && product.offerLabel ? (
        <span className="inline-flex rounded-full bg-[linear-gradient(135deg,#2b1d19,#8b6456)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#f4d4c2]">
          {product.offerLabel} · {product.offerDiscountPercent}%
          {locale === "bn" ? " ছাড়" : " off"}
        </span>
      ) : product.label ? (
        <span className="inline-flex rounded-full bg-[#f4e6dd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#8d6657]">
          {product.label}
        </span>
      ) : null}
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl font-bold">{title}</h1>
      <p className="mt-2 text-lg text-[#8b6456]">{subtitle}</p>
      <div className="mt-5 flex items-center gap-3">
        <p className="text-2xl font-semibold text-[#8f624e]">{formatBdt(price)}</p>
        {originalPrice ? (
          <p className="text-sm text-[#a0897d] line-through">{formatBdt(originalPrice)}</p>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-[#8b6456]">
        {fc.home.stock}: {product.stock} {fc.home.pieces}
      </p>
      <p className="mt-5 text-base leading-8 text-[#6c5247]">{description}</p>
      <p className="mt-3 text-sm text-[#8b6456]">{product.fabric}</p>
      {categoryTitle ? (
        <p className="mt-6 text-sm font-medium text-[#8b6456]">
          {fc.home.collectionLabel}: {categoryTitle}
        </p>
      ) : null}
      <div className="mt-8">
        <AddToCartPanel product={product} />
      </div>
    </div>
  );
}

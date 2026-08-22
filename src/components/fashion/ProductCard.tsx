"use client";

import Link from "next/link";
import type { Product } from "@/lib/fashion/types";
import { formatBdt } from "@/lib/fashion/format";
import { getEffectivePrice } from "@/lib/fashion/pricing";
import { useFashionCopy } from "@/lib/fashion/use-fashion-copy";
import { ProductCardGallery } from "./ProductGalleryCarousel";

export function ProductCard({ product }: { product: Product }) {
  const { locale } = useFashionCopy();
  const price = getEffectivePrice(product);
  const showStrike = product.offerActive || product.compareAtPrice;
  const strikePrice = product.offerActive ? product.price : product.compareAtPrice;
  const title = locale === "bn" ? product.nameBn : product.name;
  const subtitle = locale === "bn" ? product.name : product.nameBn;
  const description = locale === "bn" ? product.descriptionBn : product.description;

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_24px_80px_rgba(48,27,20,0.06)] transition hover:-translate-y-1">
      <Link href={`/products/${product.slug}`} className="block">
        <div className={`relative overflow-hidden ${product.tone}`}>
          <ProductCardGallery product={product} alt={title} className="h-40 rounded-none sm:h-56 md:h-72" />
          {(product.offerActive ? product.offerLabel : product.label) ? (
            <div className="pointer-events-none absolute right-5 top-5 rounded-full bg-[linear-gradient(135deg,#2b1d19,#8b6456)] px-3 py-1 text-xs font-semibold text-[#f4d4c2] shadow-sm">
              {product.offerActive ? product.offerLabel ?? "অফার" : product.label}
            </div>
          ) : null}
        </div>
        <div className="p-3 sm:p-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div>
              <h3 className="font-[family-name:var(--font-display)] text-base font-bold leading-snug sm:text-2xl">{title}</h3>
              <p className="mt-0.5 hidden text-sm text-[#8b6456] sm:block">{subtitle}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm font-semibold text-[#8f624e] sm:text-base">
                {formatBdt(price)}
              </p>
              {showStrike && strikePrice ? (
                <p className="text-xs text-[#a0897d] line-through">
                  {formatBdt(strikePrice)}
                </p>
              ) : null}
            </div>
          </div>
          <p className="mt-2 line-clamp-2 hidden text-sm leading-7 text-[#6c5247] sm:block">{description}</p>
        </div>
      </Link>
    </article>
  );
}

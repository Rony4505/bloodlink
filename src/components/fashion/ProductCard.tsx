import Link from "next/link";
import type { Product } from "@/lib/fashion/types";
import { formatBdt } from "@/lib/fashion/format";
import { ProductImage } from "./ProductImage";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_24px_80px_rgba(48,27,20,0.06)] transition hover:-translate-y-1">
      <Link href={`/products/${product.slug}`} className="block">
        <div className={`relative ${product.tone}`}>
          <ProductImage src={product.imageUrl} alt={product.nameBn} className="h-72 rounded-none" />
          {product.label ? (
            <div className="absolute right-5 top-5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#8d6657] shadow-sm">
              {product.label}
            </div>
          ) : null}
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold">
                {product.nameBn}
              </h3>
              <p className="mt-1 text-sm text-[#8b6456]">{product.name}</p>
            </div>
            <div className="text-right">
              <p className="text-base font-semibold text-[#8f624e]">
                {formatBdt(product.price)}
              </p>
              {product.compareAtPrice ? (
                <p className="text-xs text-[#a0897d] line-through">
                  {formatBdt(product.compareAtPrice)}
                </p>
              ) : null}
            </div>
          </div>
          <p className="mt-3 line-clamp-2 text-sm leading-7 text-[#6c5247]">
            {product.descriptionBn}
          </p>
        </div>
      </Link>
    </article>
  );
}

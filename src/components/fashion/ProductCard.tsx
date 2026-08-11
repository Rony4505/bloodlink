import Link from "next/link";
import type { Product } from "@/lib/fashion/types";
import { formatBdt } from "@/lib/fashion/format";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_24px_80px_rgba(48,27,20,0.06)] transition hover:-translate-y-1">
      <Link href={`/products/${product.slug}`} className="block">
        <div className={`relative h-64 ${product.tone} p-5`}>
          {product.label ? (
            <div className="absolute right-5 top-5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#8d6657] shadow-sm">
              {product.label}
            </div>
          ) : null}
          <div className="flex h-full items-end">
            <div className="w-full rounded-[1.5rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(245,232,225,0.78))] px-5 py-6 shadow-lg">
              <div className="flex gap-2">
                {product.colors.slice(0, 3).map((color) => (
                  <span
                    key={color.name}
                    className="h-3 w-3 rounded-full border border-black/5"
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
              <p className="mt-4 text-sm text-[#7a5c50]">{product.fabric}</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold">
                {product.name}
              </h3>
              <p className="mt-1 text-sm text-[#8b6456]">{product.nameBn}</p>
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
            {product.description}
          </p>
        </div>
      </Link>
    </article>
  );
}

import Link from "next/link";
import { copy } from "@/lib/fashion/copy";
import { formatBdt } from "@/lib/fashion/format";
import type { Product } from "@/lib/fashion/types";
import { getEffectivePrice } from "@/lib/fashion/pricing";

export function OfferBanner({ offers }: { offers: Product[] }) {
  if (!offers.length) return null;

  return (
    <section className="border-b border-[#d4b896]/25 bg-[linear-gradient(90deg,#2b1d19,#4a322c,#8b6456)] text-white">
      <div className="mx-auto max-w-7xl px-5 py-4 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#f4d4c2]/80">
              {copy.offers.banner}
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold md:text-2xl">
              {offers[0].offerLabel ?? offers[0].nameBn}
              {offers[0].offerDiscountPercent
                ? ` · ${offers[0].offerDiscountPercent}% ছাড়`
                : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {offers.slice(0, 4).map((offer) => (
              <Link
                key={offer.id}
                href={`/products/${offer.slug}`}
                className="rounded-full border border-[#f4d4c2]/25 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/20"
              >
                {offer.nameBn} · {formatBdt(getEffectivePrice(offer))}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

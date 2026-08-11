import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddToCartPanel } from "@/components/fashion/AddToCartPanel";
import { FashionShell } from "@/components/fashion/FashionShell";
import { ProductGrid } from "@/components/fashion/ProductGrid";
import { ProductImage } from "@/components/fashion/ProductImage";
import { ProductReviews } from "@/components/fashion/ProductReviews";
import { getCategory } from "@/lib/fashion/categories-server";
import { formatBdt } from "@/lib/fashion/format";
import { getEffectivePrice } from "@/lib/fashion/pricing";
import { getProductBySlug, getRelatedProducts } from "@/lib/fashion/store";
import { seedProducts } from "@/lib/fashion/seed-products";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return seedProducts.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product" };

  return {
    title: product.nameBn,
    description: product.descriptionBn,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const category = await getCategory(product.categorySlug);
  const related = await getRelatedProducts(product);
  const price = getEffectivePrice(product);
  const originalPrice = product.offerActive ? product.price : product.compareAtPrice;

  return (
    <FashionShell>
      <section className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <ProductImage src={product.imageUrl} alt={product.nameBn} className="h-[34rem]" priority />

          <div>
            {product.offerActive && product.offerLabel ? (
              <span className="inline-flex rounded-full bg-[linear-gradient(135deg,#2b1d19,#8b6456)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#f4d4c2]">
                {product.offerLabel} · {product.offerDiscountPercent}% ছাড়
              </span>
            ) : product.label ? (
              <span className="inline-flex rounded-full bg-[#f4e6dd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#8d6657]">
                {product.label}
              </span>
            ) : null}
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl font-bold">
              {product.nameBn}
            </h1>
            <p className="mt-2 text-lg text-[#8b6456]">{product.name}</p>
            <div className="mt-5 flex items-center gap-3">
              <p className="text-2xl font-semibold text-[#8f624e]">{formatBdt(price)}</p>
              {originalPrice ? (
                <p className="text-sm text-[#a0897d] line-through">{formatBdt(originalPrice)}</p>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-[#8b6456]">স্টক: {product.stock} পিস</p>
            <p className="mt-5 text-base leading-8 text-[#6c5247]">{product.descriptionBn}</p>
            <p className="mt-3 text-sm text-[#8b6456]">{product.fabric}</p>
            {category ? (
              <p className="mt-6 text-sm font-medium text-[#8b6456]">কালেকশন: {category.titleBn}</p>
            ) : null}
            <div className="mt-8">
              <AddToCartPanel product={product} />
            </div>
          </div>
        </div>

        <ProductReviews productId={product.id} />

        <div className="mt-20">
          <h2 className="font-[family-name:var(--font-display)] text-4xl font-bold">আপনার পছন্দ হতে পারে</h2>
          <div className="mt-8">
            <ProductGrid products={related} />
          </div>
        </div>
      </section>
    </FashionShell>
  );
}

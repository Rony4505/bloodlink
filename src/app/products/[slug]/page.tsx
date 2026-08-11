import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddToCartPanel } from "@/components/fashion/AddToCartPanel";
import { FashionShell } from "@/components/fashion/FashionShell";
import { ProductGrid } from "@/components/fashion/ProductGrid";
import { getCategory } from "@/lib/fashion/categories";
import { formatBdt } from "@/lib/fashion/format";
import { getProduct, getRelatedProducts, products } from "@/lib/fashion/products";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Product" };

  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const category = getCategory(product.categorySlug);
  const related = getRelatedProducts(product);

  return (
    <FashionShell>
      <section className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className={`rounded-[2rem] ${product.tone} p-8 shadow-[0_24px_80px_rgba(48,27,20,0.06)]`}>
              <div className="rounded-[1.75rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(245,232,225,0.78))] px-8 py-16">
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => (
                    <div
                      key={color.name}
                      className="rounded-2xl border border-black/5 bg-white px-4 py-4 text-center shadow-sm"
                    >
                      <div
                        className="mx-auto h-12 w-12 rounded-full border border-black/5"
                        style={{ backgroundColor: color.hex }}
                      />
                      <p className="mt-3 text-xs font-medium text-[#76584b]">{color.name}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-8 text-sm uppercase tracking-[0.24em] text-[#8b6456]">
                  {product.fabric}
                </p>
              </div>
            </div>
          </div>

          <div>
            {product.label ? (
              <span className="inline-flex rounded-full bg-[#f4e6dd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#8d6657]">
                {product.label}
              </span>
            ) : null}
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl font-bold">
              {product.name}
            </h1>
            <p className="mt-2 text-lg text-[#8b6456]">{product.nameBn}</p>
            <div className="mt-5 flex items-center gap-3">
              <p className="text-2xl font-semibold text-[#8f624e]">
                {formatBdt(product.price)}
              </p>
              {product.compareAtPrice ? (
                <p className="text-sm text-[#a0897d] line-through">
                  {formatBdt(product.compareAtPrice)}
                </p>
              ) : null}
            </div>
            <p className="mt-5 text-base leading-8 text-[#6c5247]">{product.description}</p>
            <p className="mt-3 text-base leading-8 text-[#6c5247]">{product.descriptionBn}</p>
            {category ? (
              <p className="mt-6 text-sm font-medium text-[#8b6456]">
                Collection: {category.titleBn}
              </p>
            ) : null}

            <div className="mt-8">
              <AddToCartPanel product={product} />
            </div>
          </div>
        </div>

        <div className="mt-20">
          <h2 className="font-[family-name:var(--font-display)] text-4xl font-bold">
            You may also like
          </h2>
          <div className="mt-8">
            <ProductGrid products={related} />
          </div>
        </div>
      </section>
    </FashionShell>
  );
}

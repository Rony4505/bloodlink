import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FashionShell } from "@/components/fashion/FashionShell";
import { ProductGrid } from "@/components/fashion/ProductGrid";
import { categories, getCategory } from "@/lib/fashion/categories";
import { getProductsByCategory } from "@/lib/fashion/store";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return { title: "Collection" };
  return { title: category.titleBn, description: category.description };
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const categoryProducts = await getProductsByCategory(slug);

  return (
    <FashionShell>
      <section className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
        <div className="max-w-3xl">
          <h1 className="font-[family-name:var(--font-display)] text-5xl font-bold md:text-6xl">
            {category.titleBn}
          </h1>
          <p className="mt-4 text-base leading-8 text-[#6e5449]">{category.description}</p>
        </div>
        <div className="mt-12">
          <ProductGrid products={categoryProducts} />
        </div>
      </section>
    </FashionShell>
  );
}

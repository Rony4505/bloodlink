import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FashionShell } from "@/components/fashion/FashionShell";
import { ProductGrid } from "@/components/fashion/ProductGrid";
import { ProductGalleryCarousel } from "@/components/fashion/ProductGalleryCarousel";
import { ProductPageDetails } from "@/components/fashion/ProductPageDetails";
import { ProductReviews } from "@/components/fashion/ProductReviews";
import { getCategory } from "@/lib/fashion/categories-server";
import { getProductBySlug, getRelatedProducts } from "@/lib/fashion/store";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

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

  return (
    <FashionShell>
      <section className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <ProductGalleryCarousel
            images={product.imageUrls?.length ? product.imageUrls : [product.imageUrl]}
            alt={product.nameBn}
            className="h-[22rem] sm:h-[28rem] lg:h-[34rem]"
          />
          <ProductPageDetails product={product} categoryTitle={category?.titleBn} />
        </div>

        <ProductReviews productId={product.id} />

        <div className="mt-20">
          <ProductGrid products={related} showRelatedTitle />
        </div>
      </section>
    </FashionShell>
  );
}

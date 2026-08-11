import type { Metadata } from "next";
import Link from "next/link";
import { FashionShell } from "@/components/fashion/FashionShell";
import { categories } from "@/lib/fashion/categories";
import { products } from "@/lib/fashion/products";

export const metadata: Metadata = {
  title: "Collections",
  description: "Browse luxury womenswear collections for Bangladesh.",
};

export default function CollectionsPage() {
  return (
    <FashionShell>
      <section className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-[#9b7766]">
            All collections
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl font-bold md:text-6xl">
            Shop by edit
          </h1>
          <p className="mt-4 text-base leading-8 text-[#6e5449]">
            Jamdani heritage, festive modest luxury, and daily elegance—সব collection
            carefully curated করা হয়েছে modern Bangladeshi women-এর জন্য।
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {categories.map((category) => {
            const count = products.filter(
              (product) => product.categorySlug === category.slug,
            ).length;

            return (
              <Link
                key={category.slug}
                href={`/collections/${category.slug}`}
                className={`rounded-[2rem] border border-black/6 bg-gradient-to-br ${category.accent} p-8 shadow-[0_24px_80px_rgba(48,27,20,0.06)] transition hover:-translate-y-1`}
              >
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8d6557]">
                  {count} pieces
                </p>
                <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold">
                  {category.titleBn}
                </h2>
                <p className="mt-3 text-base leading-8 text-[#694f45]">{category.description}</p>
                <p className="mt-8 text-sm font-semibold text-[#5b4339]">Explore collection ↗</p>
              </Link>
            );
          })}
        </div>
      </section>
    </FashionShell>
  );
}

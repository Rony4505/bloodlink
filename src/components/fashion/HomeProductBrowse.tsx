"use client";

import { useMemo, useState } from "react";
import { ProductGrid } from "@/components/fashion/ProductGrid";
import { getEffectivePrice } from "@/lib/fashion/pricing";
import { useFashionCopy } from "@/lib/fashion/use-fashion-copy";
import type { Category, Product } from "@/lib/fashion/types";

type PriceSort = "default" | "price-asc" | "price-desc";

function sortProducts(products: Product[], sort: PriceSort): Product[] {
  if (sort === "default") return products;
  return [...products].sort((a, b) => {
    const diff = getEffectivePrice(a) - getEffectivePrice(b);
    return sort === "price-asc" ? diff : -diff;
  });
}

function PriceSortSelect({
  value,
  onChange,
}: {
  value: PriceSort;
  onChange: (value: PriceSort) => void;
}) {
  const { fc } = useFashionCopy();

  return (
    <select
      className="field w-auto min-w-[180px] text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value as PriceSort)}
      aria-label={fc.home.sortPrice}
    >
      <option value="default">{fc.search.sortFeatured}</option>
      <option value="price-asc">{fc.search.sortPriceLow}</option>
      <option value="price-desc">{fc.search.sortPriceHigh}</option>
    </select>
  );
}

function ProductSection({
  title,
  subtitle,
  products,
  sort,
  onSortChange,
}: {
  title: string;
  subtitle?: string;
  products: Product[];
  sort: PriceSort;
  onSortChange: (value: PriceSort) => void;
}) {
  const sorted = useMemo(() => sortProducts(products, sort), [products, sort]);

  return (
    <section className="border-b border-black/5 bg-white">
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-[#9b7766]">{title}</p>
            {subtitle ? (
              <p className="mt-2 max-w-2xl text-base leading-7 text-[#6e5449]">{subtitle}</p>
            ) : null}
          </div>
          <PriceSortSelect value={sort} onChange={onSortChange} />
        </div>
        <div className="mt-8">
          <ProductGrid products={sorted} />
        </div>
      </div>
    </section>
  );
}

export function HomeProductBrowse({
  categories,
  products,
  newProducts,
  offerProducts,
  showNewProducts = true,
  showOffers = true,
}: {
  categories: Category[];
  products: Product[];
  newProducts: Product[];
  offerProducts: Product[];
  showNewProducts?: boolean;
  showOffers?: boolean;
}) {
  const { fc } = useFashionCopy();
  const [categorySlug, setCategorySlug] = useState("");
  const [categorySort, setCategorySort] = useState<PriceSort>("default");
  const [newSort, setNewSort] = useState<PriceSort>("default");
  const [offerSort, setOfferSort] = useState<PriceSort>("default");

  const categoryProducts = useMemo(() => {
    const filtered = categorySlug
      ? products.filter((p) => p.categorySlug === categorySlug)
      : products;
    return sortProducts(filtered, categorySort);
  }, [products, categorySlug, categorySort]);

  const selectedCategory = categories.find((c) => c.slug === categorySlug);

  return (
    <>
      <section className="border-b border-black/5 bg-[#f8f0eb]">
        <div className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-[#9b7766]">
                {fc.home.categoryTitle}
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
                {selectedCategory ? selectedCategory.titleBn : fc.home.allProducts}
              </h2>
              <p className="mt-2 text-sm text-[#6e5449]">{fc.home.categoryHint}</p>
            </div>
            <PriceSortSelect value={categorySort} onChange={setCategorySort} />
          </div>

          <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setCategorySlug("")}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                !categorySlug
                  ? "bg-[#8f624e] text-white shadow-md"
                  : "border border-[#e8c4b0]/60 bg-white text-[#6f554a] hover:bg-[#faf4f0]"
              }`}
            >
              {fc.search.allCategories}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setCategorySlug(cat.slug)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  categorySlug === cat.slug
                    ? "bg-[#8f624e] text-white shadow-md"
                    : "border border-[#e8c4b0]/60 bg-white text-[#6f554a] hover:bg-[#faf4f0]"
                }`}
              >
                {cat.titleBn}
              </button>
            ))}
          </div>

          <div className="mt-8">
            <ProductGrid products={categoryProducts} />
          </div>
        </div>
      </section>

      {showNewProducts ? (
        <ProductSection
          title={fc.home.newProducts}
          subtitle={fc.home.newProductsSub}
          products={newProducts}
          sort={newSort}
          onSortChange={setNewSort}
        />
      ) : null}

      {showOffers ? (
        <ProductSection
          title={fc.home.offers}
          subtitle={fc.home.offersSub}
          products={offerProducts}
          sort={offerSort}
          onSortChange={setOfferSort}
        />
      ) : null}
    </>
  );
}

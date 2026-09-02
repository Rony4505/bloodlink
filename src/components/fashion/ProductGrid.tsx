import type { Product } from "@/lib/fashion/types";
import { ProductCard } from "./ProductCard";
import { ProductGridTitle } from "./ProductGridTitle";
import { ScrollReveal } from "./ScrollReveal";

export function ProductGrid({
  products,
  showRelatedTitle,
}: {
  products: Product[];
  showRelatedTitle?: boolean;
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-[2rem] border border-black/6 bg-white p-10 text-center text-[#6f554a]">
        <ProductGridTitle kind="empty" />
      </div>
    );
  }

  return (
    <div>
      {showRelatedTitle ? (
        <div className="mb-8">
          <ProductGridTitle kind="related" />
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
        {products.map((product, index) => (
          <ScrollReveal key={product.id} delayMs={(index % 6) * 70}>
            <ProductCard product={product} />
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}

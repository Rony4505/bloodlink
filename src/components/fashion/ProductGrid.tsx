import type { Product } from "@/lib/fashion/types";
import { ProductCard } from "./ProductCard";
import { ProductGridTitle } from "./ProductGridTitle";

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
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

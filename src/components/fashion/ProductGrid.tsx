import type { Product } from "@/lib/fashion/types";
import { ProductCard } from "./ProductCard";

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-[2rem] border border-black/6 bg-white p-10 text-center text-[#6f554a]">
        এই ক্যাটাগরিতে এখন কোনো প্রোডাক্ট নেই।
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

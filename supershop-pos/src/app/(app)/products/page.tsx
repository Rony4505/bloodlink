import { ProductsManager } from "@/components/ProductsManager";
import { readStore } from "@/lib/store";

export default async function ProductsPage() {
  const store = await readStore();
  return (
    <div>
      <div className="mb-4 anim-rise">
        <h1 className="display text-4xl font-semibold md:text-5xl">Products</h1>
        <p className="text-[var(--ink-soft)]/75">
          Manage clothing variants, grocery SKUs, prices, and stock.
        </p>
      </div>
      <ProductsManager
        initialProducts={store.products}
        currency={store.settings.currency}
      />
    </div>
  );
}

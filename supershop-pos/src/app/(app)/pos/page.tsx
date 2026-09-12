import { PosTerminal } from "@/components/PosTerminal";
import { readStore } from "@/lib/store";

export default async function PosPage() {
  const store = await readStore();
  const products = store.products.filter((p) => p.active);

  return (
    <div>
      <div className="mb-4 anim-rise">
        <h1 className="display text-4xl font-semibold md:text-5xl">Sell</h1>
        <p className="text-[var(--ink-soft)]/75">
          Clothing & supershop counter — scan, pick size/color, take payment.
        </p>
      </div>
      <PosTerminal products={products} currency={store.settings.currency} />
    </div>
  );
}

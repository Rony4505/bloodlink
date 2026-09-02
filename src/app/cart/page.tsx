"use client";

import { FashionShell } from "@/components/fashion/FashionShell";
import { CheckoutOrderFlow } from "@/components/fashion/CheckoutOrderFlow";
import { useFashionCopy } from "@/lib/fashion/use-fashion-copy";

export default function CartPage() {
  const { fc } = useFashionCopy();

  return (
    <FashionShell>
      <section className="mx-auto max-w-4xl px-5 py-10 md:px-8 md:py-14">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold md:text-5xl">
          {fc.cart.title}
        </h1>
        <p className="mt-2 text-sm text-[#8b6456]">{fc.cart.flowHint}</p>
        <div className="mt-8">
          <CheckoutOrderFlow compactTitle />
        </div>
      </section>
    </FashionShell>
  );
}

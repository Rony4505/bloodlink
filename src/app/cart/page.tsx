"use client";

import { FashionShell } from "@/components/fashion/FashionShell";
import { CheckoutOrderFlow } from "@/components/fashion/CheckoutOrderFlow";
import { copy } from "@/lib/fashion/copy";

export default function CartPage() {
  return (
    <FashionShell>
      <section className="mx-auto max-w-4xl px-5 py-10 md:px-8 md:py-14">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold md:text-5xl">
          {copy.cart.title}
        </h1>
        <p className="mt-2 text-sm text-[#8b6456]">
          অর্ডার তথ্য দেখুন → তথ্য দিন → Order বাটনে কনফার্ম করুন
        </p>
        <div className="mt-8">
          <CheckoutOrderFlow compactTitle />
        </div>
      </section>
    </FashionShell>
  );
}

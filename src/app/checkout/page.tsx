"use client";

import { FashionShell } from "@/components/fashion/FashionShell";
import { CheckoutOrderFlow } from "@/components/fashion/CheckoutOrderFlow";

export default function CheckoutPage() {
  return (
    <FashionShell>
      <section className="mx-auto max-w-4xl px-5 py-10 md:px-8 md:py-14">
        <CheckoutOrderFlow />
      </section>
    </FashionShell>
  );
}

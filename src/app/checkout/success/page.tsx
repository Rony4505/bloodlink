import type { Metadata } from "next";
import { FashionButton } from "@/components/fashion/FashionButton";
import { FashionShell } from "@/components/fashion/FashionShell";

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Your Nooré Dhaka order has been placed successfully.",
};

export default function CheckoutSuccessPage() {
  return (
    <FashionShell>
      <section className="mx-auto max-w-3xl px-5 py-20 text-center md:px-8">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-[#9b7766]">
          Order confirmed
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl font-bold md:text-6xl">
          Thank you for shopping with Nooré Dhaka
        </h1>
        <p className="mt-5 text-lg leading-8 text-[#6f554a]">
          আপনার order গ্রহণ করা হয়েছে। আমাদের team শীঘ্রই WhatsApp বা phone-এ confirmation
          পাঠাবে এবং delivery update share করবে।
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <FashionButton href="/collections">Continue shopping</FashionButton>
          <FashionButton href="/contact" variant="secondary">
            Contact support
          </FashionButton>
        </div>
      </section>
    </FashionShell>
  );
}

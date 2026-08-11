import Link from "next/link";

export function FashionFooter() {
  return (
    <footer className="border-t border-black/5 bg-[#2b1d19] px-5 py-14 text-white md:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <p className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-[0.18em] uppercase">
            Nooré Dhaka
          </p>
          <p className="mt-4 max-w-md text-base leading-8 text-white/72">
            বাংলাদেশি নারীদের জন্য curated luxury fashion—effortless browsing,
            premium presentation, এবং trusted delivery experience।
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/55">
            Explore
          </p>
          <div className="mt-4 flex flex-col gap-3 text-white/78">
            <Link href="/collections">Collections</Link>
            <Link href="/cart">Shopping Cart</Link>
            <Link href="/checkout">Checkout</Link>
            <Link href="/about">Our Story</Link>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/55">
            Support
          </p>
          <div className="mt-4 space-y-3 text-white/78">
            <p>WhatsApp: +880 1XXX-XXXXXX</p>
            <p>Email: hello@nooredhaka.com</p>
            <p>Dhaka delivery + nationwide courier</p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-6 text-sm text-white/50">
        © {new Date().getFullYear()} Nooré Dhaka. All rights reserved.
      </div>
    </footer>
  );
}

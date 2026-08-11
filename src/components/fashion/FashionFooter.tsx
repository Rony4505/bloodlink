"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useFashionCopy } from "@/lib/fashion/use-fashion-copy";
import { copy } from "@/lib/fashion/copy";

export function FashionFooter() {
  const { fc } = useFashionCopy();
  const [brand, setBrand] = useState(copy.brand);

  useEffect(() => {
    fetch("/api/fashion/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings?.brandName) setBrand(data.settings.brandName);
      })
      .catch(() => undefined);
  }, []);

  return (
    <footer className="border-t border-black/5 bg-[#2b1d19] px-5 py-14 text-white md:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <p className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-[0.18em] uppercase">
            {brand}
          </p>
          <p className="mt-4 max-w-md text-base leading-8 text-white/72">{fc.footer.blurb}</p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/55">
            {fc.footer.explore}
          </p>
          <div className="mt-4 flex flex-col gap-3 text-white/78">
            <Link href="/collections">{fc.footer.collections}</Link>
            <Link href="/cart">{fc.footer.cart}</Link>
            <Link href="/checkout">{fc.footer.checkout}</Link>
            <Link href="/about">{fc.footer.about}</Link>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/55">
            {fc.footer.support}
          </p>
          <div className="mt-4 space-y-3 text-white/78">
            <p>WhatsApp: +880 1XXX-XXXXXX</p>
            <p>Email: hello@slowgun.com</p>
            <p>Dhaka delivery + nationwide courier</p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-6 text-sm text-white/50">
        © {new Date().getFullYear()} {brand}. {fc.footer.rights}
      </div>
    </footer>
  );
}

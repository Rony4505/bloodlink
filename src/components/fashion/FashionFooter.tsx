"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useFashionCopy } from "@/lib/fashion/use-fashion-copy";
import { tSetting } from "@/lib/fashion/locale-settings";
import { copy } from "@/lib/fashion/copy";
import type { StoreSettings } from "@/lib/fashion/types";

export function FashionFooter() {
  const { locale, fc } = useFashionCopy();
  const [brand, setBrand] = useState(copy.brand);
  const [settings, setSettings] = useState<Partial<StoreSettings>>({});

  useEffect(() => {
    fetch("/api/fashion/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings?.brandName) setBrand(data.settings.brandName);
        if (data.settings) setSettings(data.settings);
      })
      .catch(() => undefined);
  }, []);

  const phone = settings.contactPhone || "+880 1XXX-XXXXXX";
  const email = settings.contactEmail || "hello@smartcraftcorner.com";
  const whatsapp = settings.whatsapp || "8801700000000";
  const supportNote = tSetting(
    settings as StoreSettings,
    "supportNote",
    "supportNoteEn",
    locale,
    locale === "bn" ? "ঢাকা ডেলিভারি + সারা দেশে কুরিয়ার" : "Dhaka delivery + nationwide courier",
  );
  const blurb = tSetting(
    settings as StoreSettings,
    "footerText",
    "footerTextEn",
    locale,
    fc.footer.blurb,
  );

  return (
    <footer className="border-t border-[#e8d4e8]/80 bg-[linear-gradient(165deg,#faf4f8_0%,#f3e8f0_48%,#ebe0f0_100%)] px-5 py-14 text-[#4a3348] md:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <p className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-[0.18em] uppercase text-[#5c3d5e]">
            {brand}
          </p>
          <p className="mt-4 max-w-md text-base leading-8 text-[#6e5870]">{blurb}</p>
          {(settings.facebookUrl || settings.instagramUrl) && (
            <div className="mt-5 flex gap-4 text-sm text-[#7a6280]">
              {settings.facebookUrl ? (
                <a href={settings.facebookUrl} target="_blank" rel="noreferrer" className="hover:text-[#5c3d5e]">
                  Facebook
                </a>
              ) : null}
              {settings.instagramUrl ? (
                <a href={settings.instagramUrl} target="_blank" rel="noreferrer" className="hover:text-[#5c3d5e]">
                  Instagram
                </a>
              ) : null}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#9d6b8a]">
            {fc.footer.explore}
          </p>
          <div className="mt-4 flex flex-col gap-3 text-[#5c4860]">
            <Link href="/collections" className="hover:text-[#5c3d5e]">
              {fc.footer.collections}
            </Link>
            <Link href="/cart" className="hover:text-[#5c3d5e]">
              {fc.footer.cart}
            </Link>
            <Link href="/about" className="hover:text-[#5c3d5e]">
              {fc.footer.about}
            </Link>
            <Link href="/contact" className="hover:text-[#5c3d5e]">
              {fc.footer.contact}
            </Link>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#9d6b8a]">
            {fc.footer.support}
          </p>
          <div className="mt-4 space-y-3 text-[#5c4860]">
            <p>
              WhatsApp:{" "}
              <a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`} className="hover:text-[#5c3d5e]">
                {phone}
              </a>
            </p>
            <p>
              Email:{" "}
              <a href={`mailto:${email}`} className="hover:text-[#5c3d5e]">
                {email}
              </a>
            </p>
            <p>{supportNote}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-7xl border-t border-[#dccde0] pt-6 text-sm text-[#8a7490]">
        © {new Date().getFullYear()} {brand}. {fc.footer.rights}
      </div>
    </footer>
  );
}

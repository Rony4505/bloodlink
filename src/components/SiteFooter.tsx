"use client";

import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { useLocale } from "@/lib/i18n/locale-context";

export function SiteFooter() {
  const { t } = useLocale();
  return (
    <footer className="border-t border-[var(--line)] bg-[color-mix(in_oklab,var(--sand)_40%,white)] px-5 py-10 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <BrandMark variant="dark" size="sm" />
          <p className="mt-3 text-sm text-[color-mix(in_oklab,var(--ink)_70%,white)]">
            {t.createdBy}:{" "}
            <span className="font-semibold text-[var(--ink)]">{t.creatorName}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/about" className="underline-offset-4 hover:underline">
            {t.about}
          </Link>
          <Link href="/privacy" className="underline-offset-4 hover:underline">
            {t.privacy}
          </Link>
          <Link href="/requests" className="underline-offset-4 hover:underline">
            {t.requestBlood}
          </Link>
          <span className="text-[color-mix(in_oklab,var(--ink)_55%,white)]">
            {t.footerNote}
          </span>
        </div>
      </div>
    </footer>
  );
}

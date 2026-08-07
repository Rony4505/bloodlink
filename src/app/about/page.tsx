"use client";

import { PageShell } from "@/components/PageShell";
import { useLocale } from "@/lib/i18n/locale-context";

export default function AboutPage() {
  const { t } = useLocale();
  return (
    <PageShell title={t.aboutTitle} subtitle={t.aboutBody}>
      <div className="rounded-2xl bg-white/80 p-6 leading-relaxed md:p-8">
        <p className="text-[color-mix(in_oklab,var(--ink)_78%,white)]">{t.waitRule}</p>
        <div className="mt-8 space-y-3 border-t border-[var(--line)] pt-6">
          <p>
            <span className="font-semibold">{t.createdBy}:</span>{" "}
            <span className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--blood-deep)]">
              {t.creatorName}
            </span>
          </p>
          <p>
            <span className="font-semibold">{t.contactNumber}:</span>{" "}
            <a
              href="tel:+8801711934505"
              className="text-[var(--blood-deep)] underline-offset-4 hover:underline"
            >
              {t.creatorPhone}
            </a>
          </p>
        </div>
      </div>
    </PageShell>
  );
}

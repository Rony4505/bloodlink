"use client";

import { useLocale } from "@/lib/i18n/locale-context";

export function SafetyWarnings() {
  const { t } = useLocale();
  return (
    <div className="rounded-2xl border border-[color-mix(in_oklab,var(--blood)_28%,white)] bg-[color-mix(in_oklab,var(--blood)_6%,white)] p-6 md:p-8">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--blood-deep)] md:text-2xl">
        {t.aboutWarningTitle}
      </h2>
      <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-[color-mix(in_oklab,var(--ink)_80%,white)] md:text-base">
        <li>{t.aboutWarning1}</li>
        <li>{t.aboutWarning2}</li>
      </ol>
    </div>
  );
}

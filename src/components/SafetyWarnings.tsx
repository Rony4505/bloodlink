"use client";

import { useLocale } from "@/lib/i18n/locale-context";

export function SafetyWarnings({ immersive = false }: { immersive?: boolean }) {
  const { t } = useLocale();
  return (
    <div
      className={
        immersive
          ? "home-glass-panel p-6 md:p-8"
          : "rounded-2xl border border-[color-mix(in_oklab,var(--blood)_28%,white)] bg-[color-mix(in_oklab,var(--blood)_6%,white)] p-6 md:p-8"
      }
    >
      <h2
        className={`font-[family-name:var(--font-display)] text-xl font-bold md:text-2xl ${
          immersive ? "home-title" : "text-[var(--blood-deep)]"
        }`}
      >
        {t.aboutWarningTitle}
      </h2>
      <ol
        className={`mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed md:text-base ${
          immersive ? "home-muted" : "text-[color-mix(in_oklab,var(--ink)_80%,white)]"
        }`}
      >
        <li>{t.aboutWarning1}</li>
        <li>{t.aboutWarning2}</li>
      </ol>
    </div>
  );
}

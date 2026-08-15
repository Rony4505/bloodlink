"use client";

import { Suspense } from "react";
import { PageShell } from "@/components/PageShell";
import { SearchPanel } from "@/components/SearchPanel";
import { useLocale } from "@/lib/i18n/locale-context";

export default function FindPage() {
  const { t } = useLocale();
  return (
    <PageShell title={t.searchTitle} subtitle={t.searchSubtitle} bannerPage="find">
      <Suspense
        fallback={
          <p className="text-sm text-[color-mix(in_oklab,var(--ink)_60%,white)]">
            {t.loading}
          </p>
        }
      >
        <SearchPanel />
      </Suspense>
    </PageShell>
  );
}

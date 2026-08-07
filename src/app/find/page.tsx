"use client";

import { PageShell } from "@/components/PageShell";
import { SearchPanel } from "@/components/SearchPanel";
import { useLocale } from "@/lib/i18n/locale-context";

export default function FindPage() {
  const { t } = useLocale();
  return (
    <PageShell title={t.searchTitle} subtitle={t.searchSubtitle}>
      <SearchPanel />
    </PageShell>
  );
}

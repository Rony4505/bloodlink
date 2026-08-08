"use client";

import { PageShell } from "@/components/PageShell";
import { SearchPanel } from "@/components/SearchPanel";
import { useLocale } from "@/lib/i18n/locale-context";

export default function OrgPortalPage() {
  const { t } = useLocale();
  return (
    <PageShell title={t.orgPortal} subtitle={t.orgPortalSubtitle}>
      <SearchPanel />
    </PageShell>
  );
}

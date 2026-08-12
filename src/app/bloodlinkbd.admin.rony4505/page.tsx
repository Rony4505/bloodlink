"use client";

import { AdminPanel } from "@/components/AdminPanel";
import { PageShell } from "@/components/PageShell";
import { useLocale } from "@/lib/i18n/locale-context";

export default function OwnerConsolePage() {
  const { t } = useLocale();
  return (
    <PageShell title={t.adminTitle} subtitle={t.adminSubtitle}>
      <AdminPanel />
    </PageShell>
  );
}

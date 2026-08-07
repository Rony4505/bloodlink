"use client";

import { DashboardClient } from "@/components/DashboardClient";
import { PageShell } from "@/components/PageShell";
import { useLocale } from "@/lib/i18n/locale-context";

export default function DashboardPage() {
  const { t } = useLocale();
  return (
    <PageShell title={t.dashboardTitle} subtitle={t.dashboardSubtitle}>
      <div className="mx-auto max-w-xl">
        <DashboardClient />
      </div>
    </PageShell>
  );
}

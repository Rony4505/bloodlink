"use client";

import { PageShell } from "@/components/PageShell";
import { SafetyWarnings } from "@/components/SafetyWarnings";
import { useLocale } from "@/lib/i18n/locale-context";

export default function WarningsPage() {
  const { t } = useLocale();
  return (
    <PageShell title={t.warningsNav} subtitle={t.warningsSubtitle}>
      <SafetyWarnings />
    </PageShell>
  );
}

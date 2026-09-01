"use client";

import { HealthcareBrowser } from "@/components/healthcare/HealthcareBrowser";
import { PageShell } from "@/components/PageShell";
import { useLocale } from "@/lib/i18n/locale-context";

export default function HealthcarePage() {
  const { t } = useLocale();

  return (
    <PageShell title={t.healthcareTitle} subtitle={t.healthcareSubtitle} bannerPage="healthcare">
      <HealthcareBrowser />
    </PageShell>
  );
}

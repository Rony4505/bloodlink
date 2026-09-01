"use client";

import { use } from "react";
import { HealthcareCompanyDashboard } from "@/components/healthcare/HealthcareCompanyDashboard";
import { PageShell } from "@/components/PageShell";
import { useLocale } from "@/lib/i18n/locale-context";

export default function HealthcareManagePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const { t } = useLocale();

  return (
    <PageShell
      title={t.healthcareCompanyPortal}
      subtitle={t.healthcareCompanyPortalHint}
      showAds={false}
      showStoryForm={false}
      skipDonorPushGate
    >
      <HealthcareCompanyDashboard token={token} />
    </PageShell>
  );
}

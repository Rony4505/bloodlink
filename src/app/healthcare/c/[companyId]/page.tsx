"use client";

import { use } from "react";
import { HealthcareCompanyPublicView } from "@/components/healthcare/HealthcareCompanyPublicView";
import { PageShell } from "@/components/PageShell";
import { useLocale } from "@/lib/i18n/locale-context";

type Params = { params: Promise<{ companyId: string }> };

export default function HealthcareCompanyPage({ params }: Params) {
  const { companyId } = use(params);
  const { t } = useLocale();

  return (
    <PageShell title={t.healthcareInstitutionTitle} subtitle={t.healthcareInstitutionSubtitle}>
      <HealthcareCompanyPublicView companyId={companyId} />
    </PageShell>
  );
}

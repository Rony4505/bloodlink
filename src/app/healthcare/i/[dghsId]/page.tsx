"use client";

import { use } from "react";
import { HealthcareInstitutionView } from "@/components/healthcare/HealthcareInstitutionView";
import { PageShell } from "@/components/PageShell";
import { useLocale } from "@/lib/i18n/locale-context";

type Params = { params: Promise<{ dghsId: string }> };

export default function HealthcareInstitutionPage({ params }: Params) {
  const { dghsId } = use(params);
  const { t } = useLocale();

  return (
    <PageShell title={t.healthcareInstitutionTitle} subtitle={t.healthcareInstitutionSubtitle}>
      <HealthcareInstitutionView dghsId={dghsId} />
    </PageShell>
  );
}

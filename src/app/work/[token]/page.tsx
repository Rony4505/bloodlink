"use client";

import { PageShell } from "@/components/PageShell";
import { VolunteerWorkDashboard } from "@/components/VolunteerWorkDashboard";
import { useLocale } from "@/lib/i18n/locale-context";
import { use } from "react";

export default function VolunteerWorkPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const { t } = useLocale();

  return (
    <PageShell
      title={t.volunteerWorkBoard}
      subtitle={t.volunteerWorkPageHint}
      showAds={false}
      showStoryForm={false}
    >
      <VolunteerWorkDashboard token={token} />
    </PageShell>
  );
}

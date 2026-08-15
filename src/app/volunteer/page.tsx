"use client";

import { PageShell } from "@/components/PageShell";
import { VolunteerDashboard } from "@/components/VolunteerDashboard";
import { useLocale } from "@/lib/i18n/locale-context";

export default function VolunteerPortalPage() {
  const { t } = useLocale();
  return (
    <PageShell
      title={t.volunteerPortal}
      subtitle={t.volunteerPortalHint}
      bannerPage="home"
    >
      <VolunteerDashboard />
    </PageShell>
  );
}

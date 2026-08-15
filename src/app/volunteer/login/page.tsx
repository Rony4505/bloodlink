"use client";

import { PageShell } from "@/components/PageShell";
import { VolunteerLoginForm } from "@/components/VolunteerLoginForm";
import { useLocale } from "@/lib/i18n/locale-context";

export default function VolunteerLoginPage() {
  const { t } = useLocale();
  return (
    <PageShell
      title={t.volunteerLoginTitle}
      subtitle={t.volunteerLoginSubtitle}
      bannerPage="home"
    >
      <div className="mx-auto max-w-md">
        <VolunteerLoginForm />
      </div>
    </PageShell>
  );
}

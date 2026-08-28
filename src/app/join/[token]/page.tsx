"use client";

import { PageShell } from "@/components/PageShell";
import { RegisterForm } from "@/components/RegisterForm";
import { useLocale } from "@/lib/i18n/locale-context";
import { use } from "react";

export default function VolunteerJoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const { t } = useLocale();

  return (
    <PageShell
      title={t.volunteerJoinPageTitle}
      subtitle={t.volunteerJoinPageHint}
      showAds={false}
      showStoryForm={false}
    >
      <div className="mx-auto max-w-xl">
        <RegisterForm volunteerToken={token} />
      </div>
    </PageShell>
  );
}

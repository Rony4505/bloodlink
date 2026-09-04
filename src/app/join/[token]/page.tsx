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
  const { token: rawToken } = use(params);
  const { t } = useLocale();
  let token = rawToken;
  try {
    token = decodeURIComponent(rawToken);
  } catch {
    token = rawToken;
  }

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

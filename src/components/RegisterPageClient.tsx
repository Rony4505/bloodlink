"use client";

import { PageShell } from "@/components/PageShell";
import { RegisterForm, type SocialPrefill } from "@/components/RegisterForm";
import { useLocale } from "@/lib/i18n/locale-context";

export function RegisterPageClient({
  social,
  expired,
}: {
  social: SocialPrefill | null;
  expired: boolean;
}) {
  const { t } = useLocale();
  return (
    <PageShell
      title={social ? t.socialRegisterTitle : t.registerTitle}
      subtitle={social ? undefined : t.registerSubtitle}
    >
      <div className="mx-auto max-w-xl">
        {expired ? (
          <p className="mb-4 rounded-xl border border-[color-mix(in_oklab,var(--blood)_35%,white)] bg-white/80 px-4 py-3 text-sm text-[var(--blood-deep)]">
            {t.socialExpired}
          </p>
        ) : null}
        <RegisterForm social={social} />
      </div>
    </PageShell>
  );
}

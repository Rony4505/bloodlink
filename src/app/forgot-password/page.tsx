"use client";

import { PageShell } from "@/components/PageShell";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { useLocale } from "@/lib/i18n/locale-context";

export default function ForgotPasswordPage() {
  const { t } = useLocale();
  return (
    <PageShell title={t.forgotTitle} subtitle={t.forgotSubtitle}>
      <div className="mx-auto max-w-md">
        <ForgotPasswordForm />
      </div>
    </PageShell>
  );
}

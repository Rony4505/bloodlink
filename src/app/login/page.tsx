"use client";

import { PageShell } from "@/components/PageShell";
import { LoginForm } from "@/components/LoginForm";
import { useLocale } from "@/lib/i18n/locale-context";

export default function LoginPage() {
  const { t } = useLocale();
  return (
    <PageShell title={t.loginTitle} subtitle={t.loginSubtitle}>
      <div className="mx-auto max-w-md">
        <LoginForm />
      </div>
    </PageShell>
  );
}

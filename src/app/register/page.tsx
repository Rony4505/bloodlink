"use client";

import { PageShell } from "@/components/PageShell";
import { RegisterForm } from "@/components/RegisterForm";
import { useLocale } from "@/lib/i18n/locale-context";

export default function RegisterPage() {
  const { t } = useLocale();
  return (
    <PageShell title={t.registerTitle} subtitle={t.registerSubtitle}>
      <div className="mx-auto max-w-xl">
        <RegisterForm />
      </div>
    </PageShell>
  );
}

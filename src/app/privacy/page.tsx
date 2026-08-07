"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { useLocale } from "@/lib/i18n/locale-context";

export default function PrivacyPage() {
  const { t, locale } = useLocale();
  const [text, setText] = useState("");

  useEffect(() => {
    fetch("/api/privacy")
      .then((r) => r.json())
      .then((data) => setText(locale === "bn" ? data.bn : data.en))
      .catch(() => setText(""));
  }, [locale]);

  return (
    <PageShell title={t.privacyTitle}>
      <div className="rounded-2xl bg-white/80 p-6 md:p-8">
        <pre className="whitespace-pre-wrap font-[family-name:var(--font-body)] text-sm leading-relaxed text-[color-mix(in_oklab,var(--ink)_80%,white)] md:text-base">
          {text || t.loading}
        </pre>
      </div>
    </PageShell>
  );
}

"use client";

import { AboutContent } from "@/components/AboutContent";
import { PageShell } from "@/components/PageShell";
import { useLocale } from "@/lib/i18n/locale-context";

export default function AboutPage() {
  const { t } = useLocale();
  return (
    <PageShell title={t.about} bannerPage="about">
      <AboutContent />
    </PageShell>
  );
}

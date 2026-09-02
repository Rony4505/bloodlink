import type { Metadata } from "next";
import { BloodLinkAboutPage } from "@/components/BloodLinkAboutPage";
import { AboutPageClient } from "@/components/fashion/AboutPageClient";
import { FashionShell } from "@/components/fashion/FashionShell";
import { isFashionMode } from "@/lib/app-mode";
import { getStoreSettings } from "@/lib/fashion/store";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  if (isFashionMode()) {
    const settings = await getStoreSettings();
    return {
      title: settings.aboutTitleEn || settings.aboutTitle || "Our Story",
      description: settings.aboutTextEn || settings.aboutText || settings.metaDescription,
    };
  }
  return { title: "About" };
}

export default async function AboutPage() {
  if (isFashionMode()) {
    const settings = await getStoreSettings();
    return (
      <FashionShell>
        <AboutPageClient settings={settings} />
      </FashionShell>
    );
  }
  return <BloodLinkAboutPage />;
}

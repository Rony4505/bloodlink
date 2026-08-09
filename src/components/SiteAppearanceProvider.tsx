"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { defaultSiteAppearance } from "@/lib/site-cms";
import type { SiteAppearance } from "@/lib/types";
import { useLocale } from "@/lib/i18n/locale-context";

type SiteAppearanceContextValue = {
  appearance: SiteAppearance;
  brand: string;
  tagline: string;
  heroSupport: string;
  aboutTitle: string;
  aboutBody: string;
  logoUrl: string;
  heroBackgroundUrl: string;
  reload: () => void;
};

const SiteAppearanceContext = createContext<SiteAppearanceContextValue | null>(
  null,
);

export function SiteAppearanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale, t } = useLocale();
  const [appearance, setAppearance] = useState<SiteAppearance>(
    defaultSiteAppearance(),
  );

  function reload() {
    fetch("/api/site-content")
      .then((r) => r.json())
      .then((data) => {
        if (data.siteAppearance) setAppearance(data.siteAppearance);
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    reload();
  }, []);

  const value = useMemo<SiteAppearanceContextValue>(() => {
    const bn = locale === "bn";
    return {
      appearance,
      brand: appearance.brand || t.brand,
      tagline: (bn ? appearance.taglineBn : appearance.taglineEn) || t.tagline,
      heroSupport:
        (bn ? appearance.heroSupportBn : appearance.heroSupportEn) ||
        t.heroSupport,
      aboutTitle:
        (bn ? appearance.aboutTitleBn : appearance.aboutTitleEn) || t.aboutTitle,
      aboutBody:
        (bn ? appearance.aboutBodyBn : appearance.aboutBodyEn) || t.aboutBody,
      logoUrl: appearance.logoUrl || "/bloodlink-logo.png",
      heroBackgroundUrl: appearance.heroBackgroundUrl,
      reload,
    };
  }, [appearance, locale, t]);

  return (
    <SiteAppearanceContext.Provider value={value}>
      {children}
    </SiteAppearanceContext.Provider>
  );
}

export function useSiteAppearance() {
  const ctx = useContext(SiteAppearanceContext);
  if (!ctx) {
    throw new Error("useSiteAppearance must be used within SiteAppearanceProvider");
  }
  return ctx;
}

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

const isFashionClient =
  (process.env.NEXT_PUBLIC_APP_MODE || "").toLowerCase() === "fashion" ||
  (process.env.NEXT_PUBLIC_APP_MODE || "").toLowerCase() === "smartcraft" ||
  (process.env.NEXT_PUBLIC_APP_MODE || "").toLowerCase() === "smart-craft-corner";

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
    if (isFashionClient) return;
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
      brand: isFashionClient
        ? "Smart craft corner"
        : appearance.brand || t.brand,
      tagline: isFashionClient
        ? bn
          ? "বাংলাদেশি নারীদের জন্য লাক্সারি ফ্যাশন"
          : "Luxury fashion for Bangladeshi women"
        : (bn ? appearance.taglineBn : appearance.taglineEn) || t.tagline,
      heroSupport: isFashionClient
        ? ""
        : (bn ? appearance.heroSupportBn : appearance.heroSupportEn) ||
          t.heroSupport,
      aboutTitle: isFashionClient
        ? ""
        : (bn ? appearance.aboutTitleBn : appearance.aboutTitleEn) ||
          t.aboutTitle,
      aboutBody: isFashionClient
        ? ""
        : (bn ? appearance.aboutBodyBn : appearance.aboutBodyEn) || t.aboutBody,
      logoUrl: isFashionClient
        ? "/icon"
        : appearance.logoUrl || "/bloodlink-logo.png",
      heroBackgroundUrl: isFashionClient ? "" : appearance.heroBackgroundUrl,
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

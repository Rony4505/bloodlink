"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { clientAppMode } from "@/lib/app-mode";
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

function isFashionClientNow() {
  if (typeof window !== "undefined") {
    return clientAppMode() === "fashion";
  }
  const raw = (process.env.NEXT_PUBLIC_APP_MODE || "").toLowerCase();
  return (
    raw === "fashion" || raw === "smartcraft" || raw === "smart-craft-corner"
  );
}

export function SiteAppearanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale, t } = useLocale();
  const [appearance, setAppearance] = useState<SiteAppearance>(
    defaultSiteAppearance(),
  );
  const [fashion, setFashion] = useState(isFashionClientNow);

  useEffect(() => {
    setFashion(clientAppMode() === "fashion");
  }, []);

  function reload() {
    if (clientAppMode() === "fashion") return;
    fetch("/api/site-content")
      .then((r) => r.json())
      .then((data) => {
        if (data.siteAppearance) setAppearance(data.siteAppearance);
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    if (clientAppMode() === "fashion") return;
    reload();
  }, []);

  const value = useMemo<SiteAppearanceContextValue>(() => {
    const bn = locale === "bn";
    return {
      appearance,
      brand: fashion ? "Noorzaa" : appearance.brand || t.brand,
      tagline: fashion
        ? bn
          ? "বাংলাদেশি নারীদের জন্য লাক্সারি ফ্যাশন"
          : "Luxury fashion for Bangladeshi women"
        : (bn ? appearance.taglineBn : appearance.taglineEn) || t.tagline,
      heroSupport: fashion
        ? ""
        : (bn ? appearance.heroSupportBn : appearance.heroSupportEn) ||
          t.heroSupport,
      aboutTitle: fashion
        ? ""
        : (bn ? appearance.aboutTitleBn : appearance.aboutTitleEn) ||
          t.aboutTitle,
      aboutBody: fashion
        ? ""
        : (bn ? appearance.aboutBodyBn : appearance.aboutBodyEn) || t.aboutBody,
      logoUrl: fashion
        ? "/icon"
        : appearance.logoUrl || "/bloodlink-logo.png",
      heroBackgroundUrl: fashion ? "" : appearance.heroBackgroundUrl,
      reload,
    };
  }, [appearance, fashion, locale, t]);

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

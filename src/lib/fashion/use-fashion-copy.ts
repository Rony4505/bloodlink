"use client";

import { useLocale } from "@/lib/i18n/locale-context";
import { fashionI18n, type FashionDictionary, type FashionLocale } from "@/lib/fashion/i18n";

export function useFashionCopy(): { locale: FashionLocale; fc: FashionDictionary } {
  const { locale } = useLocale();
  const fashionLocale: FashionLocale = locale === "en" ? "en" : "bn";
  return { locale: fashionLocale, fc: fashionI18n[fashionLocale] };
}

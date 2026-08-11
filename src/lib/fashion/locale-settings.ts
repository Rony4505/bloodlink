import type { FashionLocale } from "./i18n";
import type { StoreSettings } from "./types";

/** Pick Bangla (default field) or English (*En) settings text. */
export function tSetting(
  settings: StoreSettings,
  bnKey: keyof StoreSettings,
  enKey: keyof StoreSettings,
  locale: FashionLocale,
  fallback = "",
): string {
  if (locale === "en") {
    const en = settings[enKey];
    if (typeof en === "string" && en.trim()) return en;
  }
  const bn = settings[bnKey];
  if (typeof bn === "string" && bn.trim()) return bn;
  if (locale === "en") {
    const bn2 = settings[bnKey];
    if (typeof bn2 === "string" && bn2.trim()) return bn2;
  }
  return fallback;
}

import { cn } from "@/lib/fashion/cn";
import type { FashionLocale } from "@/lib/fashion/i18n";

/** Eyebrow / section labels: wide tracking breaks Bengali conjuncts — English only. */
export function localeEyebrowClass(
  locale: FashionLocale,
  base = "text-sm font-medium text-[#9b7766]",
) {
  return cn(base, locale === "en" && "uppercase tracking-[0.28em]");
}

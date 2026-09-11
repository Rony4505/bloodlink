"use client";

import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { useLocale } from "@/lib/i18n/locale-context";

/**
 * Immersive admin chrome — separate from the public PageShell.
 * Dark ink frame + bone stage so the console feels like a private command desk.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const { t, locale, toggleLocale } = useLocale();

  return (
    <div className="admin-desk min-h-full">
      <div className="admin-desk__atmosphere" aria-hidden />
      <div className="admin-desk__grid" aria-hidden />

      <header className="admin-desk__top">
        <div className="admin-desk__top-inner">
          <Link href="/" className="admin-desk__brand" aria-label="BloodLink home">
            <BrandMark variant="light" size="sm" showWordmark />
            <span className="admin-desk__badge">
              {locale === "bn" ? "মালিক ডেস্ক" : "Owner desk"}
            </span>
          </Link>
          <div className="admin-desk__top-actions">
            <button
              type="button"
              onClick={toggleLocale}
              className="admin-desk__lang"
              aria-label="Toggle language"
            >
              {locale === "bn" ? "English" : "বাংলা"}
            </button>
            <Link href="/" className="admin-desk__exit">
              {locale === "bn" ? "সাইটে ফিরুন" : "Back to site"}
            </Link>
          </div>
        </div>
      </header>

      <div className="admin-desk__hero">
        <p className="admin-desk__eyebrow animate-rise">
          {locale === "bn" ? "BloodLink কমান্ড" : "BloodLink command"}
        </p>
        <h1 className="admin-desk__title animate-rise">
          {t.adminTitle}
        </h1>
        <p className="admin-desk__subtitle animate-rise-delay">
          {t.adminSubtitle}
        </p>
      </div>

      <main className="admin-desk__stage admin-desk-body">{children}</main>

      <footer className="admin-desk__foot">
        <span>BloodLink BD</span>
        <span className="admin-desk__foot-dot" aria-hidden />
        <span>{locale === "bn" ? "সুরক্ষিত অ্যাডমিন" : "Secured admin"}</span>
      </footer>
    </div>
  );
}

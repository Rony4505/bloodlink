"use client";

import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { SuccessStoryForm } from "@/components/SuccessStoryForm";
import { useSiteAppearance } from "@/components/SiteAppearanceProvider";
import { useLocale } from "@/lib/i18n/locale-context";
import { FacebookIcon } from "@/components/FacebookIcon";
import { DEFAULT_FACEBOOK_URL } from "@/lib/site-cms";

export function SiteFooter({
  showStoryForm = true,
  immersive = false,
}: {
  showStoryForm?: boolean;
  immersive?: boolean;
}) {
  const { t } = useLocale();
  const { appearance } = useSiteAppearance();
  const facebookUrl = appearance.facebookUrl?.trim() || DEFAULT_FACEBOOK_URL;

  const links = [
    { href: "/", label: t.bannerPageHome },
    { href: "/find", label: t.findDonors },
    { href: "/register", label: t.becomeDonor },
    { href: "/requests", label: t.requestBlood },
    { href: "/ambulance", label: t.ambulance },
    { href: "/warnings", label: t.warningsNav },
    { href: "/about", label: t.about },
    { href: "/privacy", label: t.privacy },
  ] as const;

  return (
    <footer
      className={
        immersive
          ? "home-glass-section border-t border-[rgba(255,180,185,0.14)] px-5 py-10 md:px-8"
          : "border-t border-[var(--line)] bg-[color-mix(in_oklab,var(--sand)_40%,white)] px-5 py-10 md:px-8"
      }
    >
      <div className={`mx-auto max-w-6xl space-y-10 ${immersive ? "home-glass-panel p-6 md:p-8" : ""}`}>
        {showStoryForm ? <SuccessStoryForm immersive={immersive} /> : null}
        <div
          className={`flex flex-col gap-6 md:flex-row md:items-end md:justify-between ${
            showStoryForm ? (immersive ? "border-t border-[rgba(255,180,185,0.14)] pt-8" : "border-t border-[var(--line)] pt-8") : ""
          }`}
        >
          <div>
            <BrandMark variant={immersive ? "light" : "dark"} size="sm" />
            <p className={`mt-3 text-sm ${immersive ? "home-muted" : "text-[color-mix(in_oklab,var(--ink)_70%,white)]"}`}>
              {t.createdBy}:{" "}
              <span className={`font-semibold ${immersive ? "text-white" : "text-[var(--ink)]"}`}>
                {t.creatorName}
              </span>
            </p>
            <p className={`mt-1 text-sm ${immersive ? "home-muted" : "text-[color-mix(in_oklab,var(--ink)_70%,white)]"}`}>
              <a
                href={`mailto:${t.creatorEmail}`}
                className={`underline-offset-4 hover:underline ${immersive ? "text-[#ffc8cc]" : ""}`}
              >
                {t.creatorEmail}
              </a>
              {" · "}
              <a
                href="tel:+8801711934505"
                className={`underline-offset-4 hover:underline ${immersive ? "text-[#ffc8cc]" : ""}`}
              >
                {t.creatorPhone}
              </a>
            </p>
            <p className="mt-2 text-sm">
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-semibold text-[#1877F2] underline-offset-4 hover:underline"
              >
                <FacebookIcon className="h-4 w-4 shrink-0" title="" />
                {t.facebook}
              </a>
            </p>
          </div>
          <div className={`flex max-w-xl flex-wrap items-center gap-x-4 gap-y-2 text-sm ${immersive ? "home-muted" : ""}`}>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`underline-offset-4 hover:underline ${immersive ? "hover:text-white" : ""}`}
              >
                {link.label}
              </Link>
            ))}
            <span className={immersive ? "text-[rgba(255,235,238,0.55)]" : "text-[color-mix(in_oklab,var(--ink)_55%,white)]"}>
              {t.footerNote}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

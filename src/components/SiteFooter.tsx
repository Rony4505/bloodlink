"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { BrandMark } from "@/components/BrandMark";
import { SuccessStoryForm } from "@/components/SuccessStoryForm";
import { useSiteAppearance } from "@/components/SiteAppearanceProvider";
import { useLocale } from "@/lib/i18n/locale-context";
import { FacebookIcon } from "@/components/FacebookIcon";
import { isInstalledApp } from "@/lib/browser-env";
import { DEFAULT_FACEBOOK_URL } from "@/lib/site-cms";

function GooglePlayIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#00d2ff" d="M3.6 2.3 13.3 12 3.6 21.7c-.4-.3-.6-.8-.6-1.4V3.7c0-.6.2-1.1.6-1.4Z" />
      <path fill="#00f076" d="m13.3 12 3.1-3.1-11.6-6.6c-.4-.2-.8-.3-1.2-.2L13.3 12Z" />
      <path fill="#ff3a44" d="m13.3 12-9.7 9.9c.4.1.8 0 1.2-.2l11.6-6.6L13.3 12Z" />
      <path fill="#ffd500" d="m16.4 8.9-3.1 3.1 3.1 3.1 3.7-2.1c1-.6 1-1.5 0-2.1l-3.7-2Z" />
    </svg>
  );
}

const noopSubscribe = () => () => {};

export function SiteFooter({ showStoryForm = true }: { showStoryForm?: boolean }) {
  const { t } = useLocale();
  const { appearance } = useSiteAppearance();
  const facebookUrl = appearance.facebookUrl?.trim() || DEFAULT_FACEBOOK_URL;
  // Same URL as the top install bar; pointless inside the installed app itself.
  const inApp = useSyncExternalStore(noopSubscribe, isInstalledApp, () => true);
  const playStoreUrl = inApp ? "" : appearance.playStoreUrl;

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
    <footer className="border-t border-[var(--line)] bg-[color-mix(in_oklab,var(--sand)_40%,white)] px-5 py-10 md:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        {showStoryForm ? <SuccessStoryForm /> : null}
        <div
          className={`flex flex-col gap-6 md:flex-row md:items-end md:justify-between ${
            showStoryForm ? "border-t border-[var(--line)] pt-8" : ""
          }`}
        >
          <div>
            <BrandMark variant="dark" size="sm" />
            <p className="mt-3 text-sm text-[color-mix(in_oklab,var(--ink)_70%,white)]">
              {t.createdBy}:{" "}
              <span className="font-semibold text-[var(--ink)]">{t.creatorName}</span>
            </p>
            <p className="mt-1 text-sm text-[color-mix(in_oklab,var(--ink)_70%,white)]">
              <a
                href={`mailto:${t.creatorEmail}`}
                className="underline-offset-4 hover:underline"
              >
                {t.creatorEmail}
              </a>
              {" · "}
              <a
                href="tel:+8801711934505"
                className="underline-offset-4 hover:underline"
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
            {playStoreUrl ? (
              <p className="mt-3 text-sm">
                <a
                  href={playStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bl-play-link inline-flex items-center gap-2 rounded-lg bg-[#1c1412] px-3 py-1.5 font-semibold text-white shadow-sm transition hover:bg-black"
                >
                  <GooglePlayIcon className="h-4 w-4 shrink-0" />
                  {t.appInstallFooter}
                </a>
              </p>
            ) : null}
          </div>
          <div className="flex max-w-xl flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="underline-offset-4 hover:underline"
              >
                {link.label}
              </Link>
            ))}
            <span className="text-[color-mix(in_oklab,var(--ink)_55%,white)]">
              {t.footerNote}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

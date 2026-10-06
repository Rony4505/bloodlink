"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { useSiteAppearance } from "@/components/SiteAppearanceProvider";
import { useLocale } from "@/lib/i18n/locale-context";

const DISMISS_KEY = "bloodlink_app_banner_dismissed_until";
const DISMISS_DAYS = 7;

/** Paths where the public install bar must never appear (staff / app-only surfaces). */
const HIDDEN_PREFIXES = ["/admin", "/volunteer", "/api", "/bloodlinkbd.admin"];

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <path fill="#00d2ff" d="M3.6 2.3 13.3 12 3.6 21.7c-.4-.3-.6-.8-.6-1.4V3.7c0-.6.2-1.1.6-1.4Z" />
      <path fill="#00f076" d="m13.3 12 3.1-3.1-11.6-6.6c-.4-.2-.8-.3-1.2-.2L13.3 12Z" />
      <path fill="#ff3a44" d="m13.3 12-9.7 9.9c.4.1.8 0 1.2-.2l11.6-6.6L13.3 12Z" />
      <path fill="#ffd500" d="m16.4 8.9-3.1 3.1 3.1 3.1 3.7-2.1c1-.6 1-1.5 0-2.1l-3.7-2Z" />
    </svg>
  );
}

function isAndroid(): boolean {
  return /android/i.test(navigator.userAgent);
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** Already inside the installed app (TWA / PWA) — no point asking to install. */
function isInstalledShell(): boolean {
  if (document.referrer.startsWith("android-app://")) return true;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  if (window.matchMedia("(display-mode: minimal-ui)").matches) return true;
  if ((navigator as Navigator & { standalone?: boolean }).standalone) return true;
  return false;
}

function isDismissed(): boolean {
  try {
    const until = localStorage.getItem(DISMISS_KEY);
    if (!until) return false;
    const ts = Date.parse(until);
    if (!Number.isFinite(ts) || Date.now() >= ts) {
      localStorage.removeItem(DISMISS_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function dismissFor(days: number) {
  try {
    const until = new Date(Date.now() + days * 86_400_000).toISOString();
    localStorage.setItem(DISMISS_KEY, until);
  } catch {
    /* ignore */
  }
}

// Tiny external store so eligibility is read from the browser without a
// setState-in-effect and the server snapshot is always "hidden".
const listeners = new Set<() => void>();
let closedThisPage = false;

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): boolean {
  if (closedThisPage || isIos() || isInstalledShell() || isDismissed()) return false;
  // Desktop visitors can still open the listing and remote-install to their phone.
  return isAndroid() || !/mobile/i.test(navigator.userAgent);
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Slim top-of-site bar inviting Android visitors to install the Play Store app.
 * Hidden inside the installed app, on iOS (no listing), on staff pages, and for
 * 7 days after the visitor dismisses it. Admin controls the link in Site appearance.
 */
export function AppInstallBanner() {
  const { t } = useLocale();
  const { appearance, logoUrl } = useSiteAppearance();
  const pathname = usePathname();
  const eligible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const href = appearance.playStoreUrl;
  if (!eligible || !href) return null;
  if (HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p))) return null;

  function dismiss() {
    dismissFor(DISMISS_DAYS);
    closedThisPage = true;
    listeners.forEach((cb) => cb());
  }

  return (
    <div
      role="region"
      aria-label={t.appInstallTitle}
      className="bl-app-bar relative z-30 border-b border-white/10 text-white"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2 sm:px-5 md:px-8">
        <span className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt=""
            width={34}
            height={34}
            className="h-[34px] w-[34px] rounded-[9px] bg-white object-cover shadow-sm"
          />
          <span className="absolute -bottom-1 -right-1 rounded-full bg-[#3a0a12] p-[2px]">
            <PlayIcon />
          </span>
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[13px] font-semibold sm:text-sm">{t.appInstallTitle}</p>
          <p className="line-clamp-2 text-[11px] leading-snug text-white/65 sm:truncate sm:text-xs">
            {t.appInstallBody}
          </p>
        </div>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => dismissFor(DISMISS_DAYS)}
          className="bl-app-bar-cta inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-bold text-[#3a0a12] shadow-sm transition hover:bg-white/90 active:scale-[0.97] sm:px-4 sm:text-sm"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[2.2]" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v11m0 0 4-4m-4 4-4-4M5 20h14" />
          </svg>
          {t.appInstallCta}
        </a>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t.appInstallDismiss}
          title={t.appInstallDismiss}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[2]" aria-hidden>
            <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

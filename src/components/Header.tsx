"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BrandMark } from "@/components/BrandMark";
import { NotificationBell } from "@/components/NotificationBell";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  invalidateSessionMe,
  loadLoggedIn,
  markDonorSessionInactive,
  subscribeSessionMe,
} from "@/lib/session-me-client";

function NavIcon({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden>
      {children}
    </span>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
      <circle cx="12" cy="8" r="4" />
      <path strokeLinecap="round" d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
      />
    </svg>
  );
}

function LoginIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"
      />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M3 12h18M12 3c2.5 2.8 4 6 4 9s-1.5 6.2-4 9M12 3c-2.5 2.8-4 6-4 9s1.5 6.2 4 9" />
    </svg>
  );
}

export function Header({ compact = false }: { compact?: boolean }) {
  const { t, locale, toggleLocale } = useLocale();
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadLoggedIn({ force: true }).then((ok) => {
      if (!cancelled) setLoggedIn(ok);
    });
    const unsub = subscribeSessionMe((ok) => {
      if (!cancelled) setLoggedIn(ok);
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    markDonorSessionInactive();
    invalidateSessionMe();
    window.location.href = "/";
  }

  const navItemClass =
    "inline-flex items-center gap-1.5 rounded-full p-2 transition hover:bg-white/10 sm:px-3 sm:py-2";

  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3.5 sm:gap-3 sm:px-5 sm:py-4 md:px-8">
        <BrandMark
          variant="light"
          size={compact ? "sm" : "md"}
          showWordmark={!compact}
          className={
            compact
              ? "min-w-0 max-w-[10rem] sm:max-w-none [&_span]:hidden sm:[&_span]:inline"
              : "min-w-0 max-w-[2.75rem] sm:max-w-none [&_span]:hidden sm:[&_span]:inline"
          }
        />
        <nav className="flex shrink-0 items-center justify-end gap-0.5 text-sm text-white sm:gap-2">
          {loggedIn ? (
            <>
              <NotificationBell />
              <Link
                href="/dashboard"
                className={navItemClass}
                aria-label={t.dashboard}
                title={t.dashboard}
              >
                <NavIcon>
                  <ProfileIcon />
                </NavIcon>
                <span className="hidden sm:inline">{t.dashboard}</span>
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className={navItemClass}
                aria-label={t.logout}
                title={t.logout}
              >
                <NavIcon>
                  <LogoutIcon />
                </NavIcon>
                <span className="hidden sm:inline">{t.logout}</span>
              </button>
            </>
          ) : (
            <Link href="/login" className={navItemClass} title={t.login}>
              <NavIcon>
                <LoginIcon />
              </NavIcon>
              <span className="hidden sm:inline">{t.login}</span>
            </Link>
          )}
          <button
            type="button"
            onClick={toggleLocale}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#c9852d] px-2.5 py-2 text-xs font-bold tracking-wide text-[#1c1412] shadow-sm transition hover:bg-[#d4923a] sm:px-3.5"
            aria-label="Toggle language"
          >
            <NavIcon>
              <GlobeIcon />
            </NavIcon>
            <span className="sm:hidden">{locale === "bn" ? "EN" : "BN"}</span>
            <span className="hidden sm:inline">{t.language}</span>
          </button>
        </nav>
      </div>
    </header>
  );
}

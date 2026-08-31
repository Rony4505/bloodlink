"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { NotificationBell } from "@/components/NotificationBell";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  invalidateSessionMe,
  loadLoggedIn,
  markDonorSessionInactive,
  subscribeSessionMe,
} from "@/lib/session-me-client";

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
                className="inline-flex items-center rounded-full p-2 transition hover:bg-white/10 sm:gap-1.5 sm:px-3 sm:py-2"
                aria-label={t.dashboard}
                title={t.dashboard}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 fill-none stroke-current stroke-[1.8] sm:hidden"
                  aria-hidden
                >
                  <circle cx="12" cy="8" r="4" />
                  <path strokeLinecap="round" d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                </svg>
                <span className="hidden sm:inline">{t.dashboard}</span>
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className="inline-flex items-center rounded-full p-2 transition hover:bg-white/10 sm:gap-1.5 sm:px-3 sm:py-2"
                aria-label={t.logout}
                title={t.logout}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 fill-none stroke-current stroke-[1.8] sm:hidden"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
                  />
                </svg>
                <span className="hidden sm:inline">{t.logout}</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full px-2.5 py-2 transition hover:bg-white/10 sm:px-3"
            >
              {t.login}
            </Link>
          )}
          <button
            type="button"
            onClick={toggleLocale}
            className="shrink-0 rounded-full bg-[#c9852d] px-2.5 py-2 text-xs font-bold tracking-wide text-[#1c1412] shadow-sm transition hover:bg-[#d4923a] sm:px-3.5"
            aria-label="Toggle language"
          >
            <span className="sm:hidden">{locale === "bn" ? "EN" : "BN"}</span>
            <span className="hidden sm:inline">{t.language}</span>
          </button>
        </nav>
      </div>
    </header>
  );
}

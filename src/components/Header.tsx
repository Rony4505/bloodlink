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
  const { t, toggleLocale } = useLocale();
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
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-5 md:px-8">
        <BrandMark
          variant="light"
          size={compact ? "sm" : "md"}
          showWordmark={!compact}
          className={
            compact
              ? "max-w-[10rem] sm:max-w-none"
              : "max-w-[9rem] xs:max-w-none sm:max-w-none"
          }
        />
        <nav className="flex shrink-0 flex-nowrap items-center gap-1.5 text-sm text-white sm:gap-2">
          {loggedIn ? (
            <>
              <NotificationBell />
              <Link
                href="/dashboard"
                className="rounded-full px-2.5 py-2 transition hover:bg-white/10 sm:px-3"
              >
                {t.dashboard}
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-full px-2.5 py-2 transition hover:bg-white/10 sm:px-3"
              >
                {t.logout}
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
            className="rounded-full bg-[#c9852d] px-3 py-2 text-xs font-bold tracking-wide text-[#1c1412] shadow-sm transition hover:bg-[#d4923a] sm:px-3.5"
            aria-label="Toggle language"
          >
            {t.language}
          </button>
        </nav>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { NotificationBell } from "@/components/NotificationBell";
import { useLocale } from "@/lib/i18n/locale-context";

export function Header({ compact = false }: { compact?: boolean }) {
  const { t, toggleLocale } = useLocale();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setLoggedIn(Boolean(data.donor)))
      .catch(() => setLoggedIn(false));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setLoggedIn(false);
    window.location.href = "/";
  }

  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-5 md:px-8">
        <div
          className={
            compact
              ? "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              : "flex items-center justify-between gap-3"
          }
        >
          <BrandMark
            variant="light"
            size={compact ? "sm" : "md"}
            showWordmark={!compact}
            className={compact ? "max-w-[10rem] sm:max-w-none" : "max-w-[9rem] xs:max-w-none sm:max-w-none"}
          />
          <nav
            className={`flex flex-wrap items-center text-sm text-white ${
              compact
                ? "justify-start gap-2 sm:justify-end sm:gap-2.5"
                : "justify-end gap-1.5 sm:gap-2 md:gap-3"
            }`}
          >
          {!compact ? (
            <>
          <Link
            href="/find"
            className="hidden rounded-full px-3 py-2 transition hover:bg-white/10 sm:inline"
          >
            {t.findDonors}
          </Link>
          <Link
            href="/ambulance"
            className="hidden rounded-full px-3 py-2 transition hover:bg-white/10 sm:inline"
          >
            {t.ambulance}
          </Link>
          <Link
            href="/requests"
            className="hidden rounded-full px-3 py-2 transition hover:bg-white/10 md:inline"
          >
            {t.requestBlood}
          </Link>
          <Link
            href="/warnings"
            className="hidden rounded-full px-3 py-2 transition hover:bg-white/10 lg:inline"
          >
            {t.warningsNav}
          </Link>
            </>
          ) : (
            <Link
              href="/"
              className="rounded-full px-3 py-2 transition hover:bg-white/10"
            >
              {t.bannerPageHome}
            </Link>
          )}
          {!compact && loggedIn ? (
            <>
              <NotificationBell />
              <Link
                href="/dashboard"
                className="rounded-full px-3 py-2 transition hover:bg-white/10"
              >
                {t.dashboard}
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-full px-3 py-2 transition hover:bg-white/10"
              >
                {t.logout}
              </button>
            </>
          ) : !compact ? (
            <>
              <Link
                href="/login"
                className="rounded-full px-3 py-2 transition hover:bg-white/10"
              >
                {t.login}
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-[#2f6b4f] px-3.5 py-2 font-semibold text-white shadow-sm transition hover:bg-[#265a42]"
              >
                {t.becomeDonor}
              </Link>
            </>
          ) : null}
          <button
            type="button"
            onClick={toggleLocale}
            className="rounded-full bg-[#c9852d] px-3.5 py-2 text-xs font-bold tracking-wide text-[#1c1412] shadow-sm transition hover:bg-[#d4923a]"
            aria-label="Toggle language"
          >
            {t.language}
          </button>
          </nav>
        </div>
      </div>
    </header>
  );
}

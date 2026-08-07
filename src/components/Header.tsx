"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NotificationBell } from "@/components/NotificationBell";
import { useLocale } from "@/lib/i18n/locale-context";

export function Header() {
  const { t, toggleLocale } = useLocale();
  const [loggedIn, setLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setLoggedIn(Boolean(data.donor)))
      .catch(() => setLoggedIn(false));

    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((data) => setIsAdmin(Boolean(data.admin)))
      .catch(() => setIsAdmin(false));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setLoggedIn(false);
    window.location.href = "/";
  }

  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-white drop-shadow-sm md:text-[1.7rem]"
        >
          {t.brand}
        </Link>
        <nav className="flex items-center gap-2 text-sm text-white md:gap-3">
          <Link
            href="/find"
            className="hidden rounded-full px-3 py-2 transition hover:bg-white/10 sm:inline"
          >
            {t.findDonors}
          </Link>
          <Link
            href="/requests"
            className="hidden rounded-full px-3 py-2 transition hover:bg-white/10 md:inline"
          >
            {t.requestBlood}
          </Link>
          <Link
            href="/about"
            className="hidden rounded-full px-3 py-2 transition hover:bg-white/10 lg:inline"
          >
            {t.about}
          </Link>
          {isAdmin ? (
            <Link
              href="/owner-hq-7f3m"
              className="rounded-full px-3 py-2 transition hover:bg-white/10"
            >
              {t.admin}
            </Link>
          ) : null}
          {loggedIn ? (
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
          ) : (
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
          )}
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
    </header>
  );
}

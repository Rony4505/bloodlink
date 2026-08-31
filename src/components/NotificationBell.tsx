"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";

export function NotificationBell() {
  const { t } = useLocale();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const load = () => {
      fetch("/api/notifications")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) setUnread(data.unread || 0);
        })
        .catch(() => undefined);
    };
    load();
    const id = window.setInterval(load, 45_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <Link
      href="/notifications"
      className="relative inline-flex shrink-0 items-center rounded-full p-2 transition hover:bg-white/10 sm:gap-1.5 sm:px-3 sm:py-2"
      title={t.notifications}
      aria-label={t.notifications}
    >
      <span className="relative inline-flex h-5 w-5 items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 fill-none stroke-current stroke-[1.8]"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0m6 0H9"
          />
        </svg>
        {unread > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c9852d] px-1 text-[9px] font-bold leading-none text-[#1c1412]">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </span>
      <span className="hidden sm:inline">{t.notifications}</span>
    </Link>
  );
}

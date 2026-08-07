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
    const id = window.setInterval(load, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <Link
      href="/notifications"
      className="relative rounded-full px-3 py-2 transition hover:bg-white/10"
      title={t.notifications}
    >
      {t.notifications}
      {unread > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c9852d] px-1 text-[10px] font-bold text-[#1c1412]">
          {unread}
        </span>
      ) : null}
    </Link>
  );
}

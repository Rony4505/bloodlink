"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  href: string;
};

export function VolunteerNotificationBell({ token }: { token: string }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/public/volunteer/${encodeURIComponent(token)}/notifications`,
        { cache: "no-store" },
      );
      if (!res.ok) return;
      const data = (await res.json()) as {
        notifications?: NotificationRow[];
        unread?: number;
      };
      setItems(data.notifications || []);
      setUnread(data.unread || 0);
    } catch {
      // ignore
    }
  }, [token]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 45_000);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  async function markRead(id: string) {
    await fetch(
      `/api/public/volunteer/${encodeURIComponent(token)}/notifications`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      },
    );
    void load();
  }

  async function markAllRead() {
    await fetch(
      `/api/public/volunteer/${encodeURIComponent(token)}/notifications`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      },
    );
    void load();
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
        aria-label={t.notifications}
        title={t.notifications}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
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
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c9852d] px-1 text-[9px] font-bold text-[#1c1412]">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-[min(92vw,22rem)] overflow-hidden rounded-2xl border border-[var(--line)] bg-white text-[var(--ink)] shadow-xl">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
            <p className="text-sm font-semibold">{t.notifications}</p>
            {unread > 0 ? (
              <button
                type="button"
                className="text-xs font-semibold text-[var(--blood-deep)] underline"
                onClick={() => void markAllRead()}
              >
                {t.markAllRead}
              </button>
            ) : null}
          </div>
          {!items.length ? (
            <p className="px-4 py-6 text-sm text-[color-mix(in_oklab,var(--ink)_55%,white)]">
              {t.volunteerNoNotifications}
            </p>
          ) : (
            <ul className="max-h-72 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id} className="border-b border-[var(--line)] last:border-0">
                  <button
                    type="button"
                    className={`block w-full px-4 py-3 text-left text-sm hover:bg-[var(--cream)] ${
                      n.read ? "opacity-70" : "bg-[color-mix(in_oklab,var(--sand)_35%,white)]"
                    }`}
                    onClick={() => void markRead(n.id)}
                  >
                    <p className="font-semibold">{n.title}</p>
                    <p className="mt-0.5 text-xs text-[color-mix(in_oklab,var(--ink)_60%,white)]">
                      {n.body}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

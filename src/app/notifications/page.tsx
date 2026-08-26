"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { useLocale } from "@/lib/i18n/locale-context";
import { localizeNotification } from "@/lib/notification-text";

type Note = {
  id: string;
  title: string;
  body: string;
  titleEn?: string;
  bodyEn?: string;
  titleBn?: string;
  bodyBn?: string;
  href: string;
  postId?: string | null;
  type: string;
  read: boolean;
  createdAt: string;
};

function typeLabel(type: string, locale: "en" | "bn") {
  if (locale === "bn") {
    if (type === "blood_request") return "রক্তের প্রয়োজন";
    if (type === "daily_update") return "দৈনিক রিমাইন্ডার";
    if (type === "contact_change") return "যোগাযোগ আপডেট";
    if (type === "system") return "সিস্টেম";
    return "নোটিফিকেশন";
  }
  if (type === "blood_request") return "Blood need";
  if (type === "daily_update") return "Daily reminder";
  if (type === "contact_change") return "Contact update";
  if (type === "system") return "System";
  return "Notification";
}

export default function NotificationsPage() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [items, setItems] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/notifications");
    if (!res.ok) {
      router.replace("/login");
      return;
    }
    const data = await res.json();
    setItems(data.notifications || []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [router]);

  async function markAll() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    await load();
  }

  async function openNote(note: Note) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: note.id }),
    });

    if (note.postId) {
      router.push(`/requests/${note.postId}`);
      return;
    }

    if (note.href?.startsWith("/requests/")) {
      router.push(note.href);
      return;
    }

    if (note.type === "blood_request") {
      router.push("/requests");
      return;
    }

    router.push(note.href || "/dashboard");
  }

  const unread = items.filter((n) => !n.read).length;

  return (
    <PageShell title={t.notifications}>
      <div className="overflow-hidden rounded-[1.75rem] border border-[color-mix(in_oklab,var(--blood)_18%,transparent)] bg-[linear-gradient(165deg,#fff8f4_0%,#ffffff_42%,#f7f1ea_100%)] shadow-[0_18px_50px_-28px_rgba(90,20,30,0.45)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 bg-[color-mix(in_oklab,var(--blood)_8%,white)] px-5 py-4">
          <div>
            <p className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--blood-deep)]">
              {t.notifications}
            </p>
            <p className="mt-0.5 text-xs font-medium text-[color-mix(in_oklab,var(--ink)_58%,white)]">
              {loading
                ? t.loading
                : locale === "bn"
                  ? unread
                    ? `${unread}টি অপঠিত`
                    : "সব পঠিত"
                  : unread
                    ? `${unread} unread`
                    : "All caught up"}
            </p>
          </div>
          <button type="button" className="btn-ghost" onClick={markAll} disabled={!items.length}>
            {t.markAllRead}
          </button>
        </div>

        <div className="p-4 sm:p-5">
          {loading ? (
            <p className="text-sm text-[color-mix(in_oklab,var(--ink)_60%,white)]">{t.loading}</p>
          ) : !items.length ? (
            <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white/70 px-5 py-10 text-center">
              <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--blood-deep)]">
                {t.noNotifications}
              </p>
              <p className="mt-2 text-sm text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                {locale === "bn"
                  ? "রক্তের প্রয়োজন পোস্ট হলে বা দৈনিক রিমাইন্ডার এলে এখানে দেখাবে।"
                  : "Blood needs and daily reminders will show up here."}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((n) => {
                const text = localizeNotification(n, locale);
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => openNote(n)}
                      className={`group w-full rounded-2xl border px-4 py-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                        n.read
                          ? "border-black/5 bg-white/75"
                          : "border-[color-mix(in_oklab,var(--blood)_22%,transparent)] bg-[color-mix(in_oklab,var(--blood)_7%,white)] shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="inline-flex rounded-full bg-[color-mix(in_oklab,var(--sage)_16%,white)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--sage)]">
                            {typeLabel(n.type, locale)}
                          </span>
                          <p className="mt-2 font-semibold text-[var(--ink)]">{text.title}</p>
                          <p className="mt-1 text-sm leading-relaxed text-[color-mix(in_oklab,var(--ink)_72%,white)]">
                            {text.body}
                          </p>
                        </div>
                        {!n.read ? (
                          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--blood)]" />
                        ) : null}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-[var(--blood-deep)] group-hover:underline">
                          {n.type === "blood_request" ? t.viewDetails : t.openSettings}
                        </span>
                        <span className="opacity-65">
                          {new Date(n.createdAt).toLocaleString(
                            locale === "bn" ? "bn-BD" : "en-BD",
                          )}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <Link href="/dashboard" className="btn-ghost mt-5 inline-flex">
            {t.dashboard}
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

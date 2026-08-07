"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { useLocale } from "@/lib/i18n/locale-context";

type Note = {
  id: string;
  title: string;
  body: string;
  href: string;
  postId?: string | null;
  type: string;
  read: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [items, setItems] = useState<Note[]>([]);

  async function load() {
    const res = await fetch("/api/notifications");
    if (!res.ok) {
      router.replace("/login");
      return;
    }
    const data = await res.json();
    setItems(data.notifications || []);
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

  return (
    <PageShell title={t.notifications}>
      <div className="rounded-2xl bg-white/80 p-5">
        <div className="mb-4 flex justify-end">
          <button type="button" className="btn-ghost" onClick={markAll}>
            {t.markAllRead}
          </button>
        </div>
        {!items.length ? (
          <p className="text-sm text-[color-mix(in_oklab,var(--ink)_60%,white)]">
            {t.noNotifications}
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => openNote(n)}
                  className={`w-full rounded-xl px-4 py-3 text-left ${
                    n.read
                      ? "bg-[color-mix(in_oklab,var(--sand)_25%,white)]"
                      : "bg-[color-mix(in_oklab,var(--sage)_12%,white)]"
                  }`}
                >
                  <p className="font-semibold">{n.title}</p>
                  <p className="mt-1 text-sm">{n.body}</p>
                  <p className="mt-2 text-xs font-semibold text-[var(--blood-deep)]">
                    {n.type === "blood_request" ? t.viewDetails : n.href}
                  </p>
                  <p className="mt-1 text-xs opacity-70">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
        <Link href="/dashboard" className="btn-ghost mt-4 inline-flex">
          {t.dashboard}
        </Link>
      </div>
    </PageShell>
  );
}

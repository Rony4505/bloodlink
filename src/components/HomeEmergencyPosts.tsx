"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import type { PostUrgency } from "@/lib/types";

type EmergencyPost = {
  id: string;
  patientName: string;
  bloodGroup: string;
  unitsNeeded: number;
  district: string;
  area: string;
  hospital: string;
  neededBy: string;
  message: string;
  urgency: PostUrgency;
};

function urgencyLabel(
  urgency: PostUrgency,
  t: { urgencyCritical: string; urgencyUrgent: string; urgencyModerate: string },
) {
  if (urgency === "critical") return t.urgencyCritical;
  if (urgency === "urgent") return t.urgencyUrgent;
  return t.urgencyModerate;
}

function urgencyClass(urgency: PostUrgency, immersive: boolean) {
  if (immersive) {
    if (urgency === "critical") {
      return "border-[rgba(255,120,130,0.55)] bg-[rgba(120,16,28,0.55)] text-[#ffe8ea]";
    }
    if (urgency === "urgent") {
      return "border-[rgba(255,160,100,0.45)] bg-[rgba(90,30,12,0.45)] text-[#ffe8dc]";
    }
    return "home-glass-card text-[rgba(255,240,242,0.9)]";
  }
  if (urgency === "critical") {
    return "border-[var(--blood)] bg-[color-mix(in_oklab,var(--blood)_12%,white)] text-[var(--blood-deep)]";
  }
  if (urgency === "urgent") {
    return "border-[#c45c26] bg-[color-mix(in_oklab,#c45c26_10%,white)] text-[#8a3a12]";
  }
  return "border-[var(--line)] bg-white text-[color-mix(in_oklab,var(--ink)_70%,white)]";
}

export function HomeEmergencyPosts({ immersive = false }: { immersive?: boolean }) {
  const { t } = useLocale();
  const [posts, setPosts] = useState<EmergencyPost[]>([]);

  useEffect(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then((data) => {
        const list = (data.posts || []) as EmergencyPost[];
        setPosts(list.slice(0, 6));
      })
      .catch(() => setPosts([]));
  }, []);

  if (!posts.length) return null;

  return (
    <section
      className={
        immersive
          ? "home-glass-section px-5 py-16 md:px-8"
          : "border-t border-[var(--line)] bg-white px-5 py-16 md:px-8"
      }
    >
      <div className={immersive ? "home-glass-panel mx-auto max-w-6xl p-6 md:p-8" : "mx-auto max-w-6xl"}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p
              className={
                immersive
                  ? "text-xs font-semibold uppercase tracking-[0.14em] text-[#ff8a96]"
                  : "text-xs font-semibold uppercase tracking-[0.14em] text-[var(--blood)]"
              }
            >
              {t.emergencyBadge}
            </p>
            <h2
              className={`mt-2 font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl ${
                immersive ? "home-title" : "text-[var(--blood-deep)]"
              }`}
            >
              {t.emergencyTitle}
            </h2>
            <p className={`mt-2 max-w-2xl ${immersive ? "home-muted" : "text-[color-mix(in_oklab,var(--ink)_70%,white)]"}`}>
              {t.emergencySubtitle}
            </p>
          </div>
          <Link href="/requests" className={immersive ? "btn-glass-secondary" : "btn-ghost"}>
            {t.viewAllRequests}
          </Link>
        </div>

        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {posts.map((p) => (
            <li key={p.id}>
              <Link
                href={`/requests/${p.id}`}
                className={`block rounded-2xl border px-5 py-4 transition hover:-translate-y-0.5 hover:shadow-lg ${urgencyClass(p.urgency, immersive)}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--blood)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    {urgencyLabel(p.urgency, t)}
                  </span>
                  <span className="rounded-md bg-[var(--blood-deep)] px-2 py-0.5 text-xs font-bold text-white">
                    {p.bloodGroup}
                  </span>
                  <span className="text-xs opacity-80">
                    {p.unitsNeeded} {t.units}
                  </span>
                </div>
                <h3 className="mt-3 font-[family-name:var(--font-display)] text-lg font-bold">
                  {p.patientName}
                </h3>
                <p className="mt-1 text-sm">
                  {p.hospital} · {p.area}, {p.district}
                </p>
                <p className="mt-1 text-xs opacity-80">
                  {t.neededBy}: {p.neededBy}
                </p>
                <p className="mt-2 line-clamp-2 text-sm opacity-90">{p.message}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

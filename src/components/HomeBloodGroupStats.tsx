"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BLOOD_GROUPS } from "@/lib/districts";
import { useLocale } from "@/lib/i18n/locale-context";

type GroupStat = {
  bloodGroup: string;
  available: number;
  unavailable: number;
  total: number;
};

type StatsPayload = {
  totalAvailable: number;
  totalUnavailable: number;
  byGroup: GroupStat[];
};

export function HomeBloodGroupStats() {
  const { t } = useLocale();
  const [stats, setStats] = useState<StatsPayload | null>(null);

  useEffect(() => {
    fetch("/api/donors/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => setStats(null));
  }, []);

  const groups =
    stats?.byGroup?.length
      ? stats.byGroup
      : BLOOD_GROUPS.map((bloodGroup) => ({
          bloodGroup,
          available: 0,
          unavailable: 0,
          total: 0,
        }));

  return (
    <section className="bg-[var(--mist)] px-5 py-16 md:px-8 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--blood-deep)] md:text-4xl">
              {t.bloodGroupStatsTitle}
            </h2>
            <p className="mt-2 max-w-2xl text-[color-mix(in_oklab,var(--ink)_70%,white)]">
              {t.bloodGroupStatsSub}
            </p>
          </div>
          <Link href="/find" className="btn-ghost">
            {t.viewAll}
          </Link>
        </div>

        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
          {groups.map((g) => (
            <li
              key={g.bloodGroup}
              className="rounded-2xl border border-[var(--line)] bg-white/90 px-4 py-4 shadow-[0_10px_30px_rgba(60,20,24,0.04)]"
            >
              <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--blood-deep)]">
                {g.bloodGroup}
              </p>
              <p className="mt-3 text-sm font-semibold text-[var(--sage)]">
                {t.available}: {g.available}
              </p>
              <p className="mt-1 text-sm font-semibold text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                {t.unavailable}: {g.unavailable}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function HomeDonorTotals() {
  const { t } = useLocale();
  const [stats, setStats] = useState<StatsPayload | null>(null);

  useEffect(() => {
    fetch("/api/donors/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => setStats(null));
  }, []);

  const available = stats?.totalAvailable ?? 0;
  const unavailable = stats?.totalUnavailable ?? 0;

  return (
    <div className="mt-6 grid max-w-xl grid-cols-2 gap-3">
      <div className="rounded-2xl border border-white/20 bg-white/12 px-4 py-3 backdrop-blur-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
          {t.available}
        </p>
        <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold text-white">
          {available}
        </p>
      </div>
      <div className="rounded-2xl border border-white/20 bg-white/12 px-4 py-3 backdrop-blur-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
          {t.unavailable}
        </p>
        <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold text-white">
          {unavailable}
        </p>
      </div>
    </div>
  );
}

"use client";

import { CountUp } from "@/components/CountUp";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BLOOD_GROUPS } from "@/lib/districts";
import { loadDonorStats } from "@/lib/donor-stats-client";
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

const POLL_MS = 12_000;

function BloodDropButton({
  label,
  available,
  unavailable,
  availableLabel,
  unavailableLabel,
  onClick,
}: {
  label: string;
  available: number;
  unavailable: number;
  availableLabel: string;
  unavailableLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-2 rounded-2xl border border-[var(--line)] bg-white/90 px-2 py-4 transition hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--blood)_35%,white)] hover:shadow-md"
    >
      <span className="relative inline-flex h-[4.75rem] w-[3.75rem] items-center justify-center">
        <svg
          viewBox="0 0 64 84"
          className="h-full w-full drop-shadow-md transition group-hover:scale-105"
          aria-hidden
        >
          <defs>
            <linearGradient
              id={`drop-${label.replace("+", "pos").replace("-", "neg")}`}
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop offset="0%" stopColor="#9b1b2e" />
              <stop offset="55%" stopColor="#6e1220" />
              <stop offset="100%" stopColor="#3d0c14" />
            </linearGradient>
          </defs>
          <path
            d="M32 4C32 4 8 34 8 52c0 13.255 10.745 24 24 24s24-10.745 24-24C56 34 32 4 32 4z"
            fill={`url(#drop-${label.replace("+", "pos").replace("-", "neg")})`}
          />
          <path
            d="M22 28c4-8 8-14 10-18 2 4 6 10 10 18"
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center pt-3 font-[family-name:var(--font-display)] text-lg font-bold text-white drop-shadow">
          {label}
        </span>
      </span>
      <span className="text-center text-xs font-semibold leading-5 text-[var(--sage)]">
        {availableLabel}: <CountUp value={available} />
      </span>
      <span className="text-center text-xs font-semibold leading-5 text-[color-mix(in_oklab,var(--ink)_55%,white)]">
        {unavailableLabel}: <CountUp value={unavailable} />
      </span>
    </button>
  );
}

function useLiveDonorStats() {
  const [stats, setStats] = useState<StatsPayload | null>(null);

  useEffect(() => {
    let alive = true;

    async function refresh(force = false) {
      const data = await loadDonorStats({ force });
      if (!alive) return;
      setStats({
        totalAvailable: data.totalAvailable,
        totalUnavailable: data.totalUnavailable,
        byGroup: data.byGroup || [],
      });
    }

    void refresh(true);

    const pollId = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh(true);
    }, POLL_MS);

    const onFocus = () => void refresh(true);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh(true);
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      alive = false;
      window.clearInterval(pollId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return stats;
}

export function HomeBloodGroupStats() {
  const { t } = useLocale();
  const router = useRouter();
  const stats = useLiveDonorStats();

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
    <section className="bg-[var(--mist)] px-5 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--blood-deep)] md:text-3xl">
              {t.bloodGroupStatsTitle}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[color-mix(in_oklab,var(--ink)_70%,white)]">
              {t.bloodGroupStatsSub}
            </p>
          </div>
          <Link href="/find" className="btn-primary">
            {t.viewAll}
          </Link>
        </div>

        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
          {groups.map((g) => (
            <li key={g.bloodGroup}>
              <BloodDropButton
                label={g.bloodGroup}
                available={g.available}
                unavailable={g.unavailable}
                availableLabel={t.available}
                unavailableLabel={t.unavailable}
                onClick={() =>
                  router.push(
                    `/find?bloodGroup=${encodeURIComponent(g.bloodGroup)}`,
                  )
                }
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function HomeDonorTotals() {
  const { t } = useLocale();
  const stats = useLiveDonorStats();

  return (
    <p className="animate-rise-delay-2 hero-glass-stats mt-5 text-sm text-white/90 md:text-base">
      <span className="font-semibold text-white">
        {t.available}: <CountUp value={stats?.totalAvailable ?? 0} />
      </span>
      <span className="mx-2 text-white/40">·</span>
      <span>
        {t.unavailable}: <CountUp value={stats?.totalUnavailable ?? 0} />
      </span>
    </p>
  );
}

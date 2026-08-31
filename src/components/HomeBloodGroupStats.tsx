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
  const gradId = `drop-${label.replace("+", "pos").replace("-", "neg")}`;
  const shineId = `shine-${label.replace("+", "pos").replace("-", "neg")}`;

  return (
    <button
      type="button"
      onClick={onClick}
      className="blood-drop-card group flex w-full flex-col items-center gap-2.5 px-3 py-5"
    >
      <span className="relative inline-flex h-[5.25rem] w-[4.1rem] items-center justify-center">
        <span
          aria-hidden
          className="absolute bottom-0 h-3 w-[70%] rounded-[50%] bg-[rgba(110,18,32,0.18)] blur-md transition group-hover:scale-110"
        />
        <svg
          viewBox="0 0 64 84"
          className="relative h-full w-full drop-shadow-[0_10px_18px_rgba(110,18,32,0.35)] transition duration-300 group-hover:scale-105"
          aria-hidden
        >
          <defs>
            <linearGradient id={gradId} x1="0.15" y1="0" x2="0.85" y2="1">
              <stop offset="0%" stopColor="#ff8a96" />
              <stop offset="28%" stopColor="#e84555" />
              <stop offset="58%" stopColor="#b81e32" />
              <stop offset="100%" stopColor="#4a0c16" />
            </linearGradient>
            <radialGradient id={shineId} cx="0.35" cy="0.22" r="0.55">
              <stop offset="0%" stopColor="rgba(255,255,255,0.72)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            <filter id={`glow-${gradId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#6e1220" floodOpacity="0.35" />
            </filter>
          </defs>
          <path
            d="M32 4C32 4 8 34 8 52c0 13.255 10.745 24 24 24s24-10.745 24-24C56 34 32 4 32 4z"
            fill={`url(#${gradId})`}
            filter={`url(#glow-${gradId})`}
          />
          <path
            d="M32 4C32 4 8 34 8 52c0 13.255 10.745 24 24 24s24-10.745 24-24C56 34 32 4 32 4z"
            fill={`url(#${shineId})`}
          />
          <path
            d="M22 28c4-8 8-14 10-18 2 4 6 10 10 18"
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <ellipse cx="24" cy="30" rx="4" ry="6" fill="rgba(255,255,255,0.18)" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center pt-3.5 font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]">
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
          </div>
          <Link href="/find" className="btn-glass-primary">
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
    <p className="animate-rise-delay-2 mt-5 text-sm text-white/85 md:text-base">
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

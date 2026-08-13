"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DonorResults } from "@/components/DonorResults";
import { BLOOD_GROUPS } from "@/lib/districts";
import { useLocale } from "@/lib/i18n/locale-context";
import type { PublicDonor } from "@/lib/types";

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

function BloodDropButton({
  label,
  selected,
  available,
  unavailable,
  availableLabel,
  unavailableLabel,
  onClick,
}: {
  label: string;
  selected: boolean;
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
      aria-pressed={selected}
      className={`group flex flex-col items-center gap-2 rounded-2xl border px-2 py-4 transition ${
        selected
          ? "border-[var(--blood)] bg-[color-mix(in_oklab,var(--blood)_10%,white)] shadow-[0_12px_28px_rgba(155,27,46,0.18)]"
          : "border-[var(--line)] bg-white/90 hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--blood)_35%,white)] hover:shadow-md"
      }`}
    >
      <span className="relative inline-flex h-[4.75rem] w-[3.75rem] items-center justify-center">
        <svg
          viewBox="0 0 64 84"
          className={`h-full w-full drop-shadow-md transition ${
            selected ? "scale-105" : "group-hover:scale-105"
          }`}
          aria-hidden
        >
          <defs>
            <linearGradient id={`drop-${label.replace("+", "pos").replace("-", "neg")}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={selected ? "#c6283a" : "#9b1b2e"} />
              <stop offset="55%" stopColor={selected ? "#9b1b2e" : "#6e1220"} />
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
        {availableLabel}: {available}
      </span>
      <span className="text-center text-xs font-semibold leading-5 text-[color-mix(in_oklab,var(--ink)_55%,white)]">
        {unavailableLabel}: {unavailable}
      </span>
    </button>
  );
}

export function HomeBloodGroupStats() {
  const { t } = useLocale();
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [donors, setDonors] = useState<PublicDonor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/donors/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => setStats(null));
  }, []);

  async function openGroup(bloodGroup: string) {
    if (selectedGroup === bloodGroup) {
      setSelectedGroup(null);
      setDonors([]);
      setError("");
      return;
    }
    setSelectedGroup(bloodGroup);
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ bloodGroup });
      const res = await fetch(`/api/donors?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errorGeneric);
        setDonors([]);
        return;
      }
      setDonors(data.donors || []);
      requestAnimationFrame(() => {
        document.getElementById("blood-group-donors")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    } catch {
      setError(t.errorGeneric);
      setDonors([]);
    } finally {
      setLoading(false);
    }
  }

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
            <li key={g.bloodGroup}>
              <BloodDropButton
                label={g.bloodGroup}
                selected={selectedGroup === g.bloodGroup}
                available={g.available}
                unavailable={g.unavailable}
                availableLabel={t.available}
                unavailableLabel={t.unavailable}
                onClick={() => void openGroup(g.bloodGroup)}
              />
            </li>
          ))}
        </ul>

        {selectedGroup ? (
          <div id="blood-group-donors" className="mt-10 scroll-mt-24">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--blood-deep)]">
                {t.donorsInGroup.replace("{group}", selectedGroup)}
              </h3>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setSelectedGroup(null);
                  setDonors([]);
                }}
              >
                {t.close}
              </button>
            </div>
            {loading ? (
              <p className="rounded-2xl bg-white/70 px-5 py-8 text-center text-sm">
                {t.loading}
              </p>
            ) : error ? (
              <p className="text-sm text-[var(--blood)]">{error}</p>
            ) : (
              <DonorResults donors={donors} />
            )}
          </div>
        ) : null}
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

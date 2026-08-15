"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";

type ImpactStats = {
  livesHelped: number;
  registeredUsers: number;
  activeRequests: number;
  citiesCovered: number;
};

type Story = {
  id: string;
  name: string;
  handle: string;
  quoteEn: string;
  quoteBn: string;
};

function formatCount(n: number): string {
  if (n <= 0) return "0";
  return `${n.toLocaleString()}+`;
}

export function HomeImpact() {
  const { locale, t } = useLocale();
  const [stats, setStats] = useState<ImpactStats | null>(null);
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    fetch("/api/impact")
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats || null);
        setStories(data.stories || []);
      })
      .catch(() => {
        setStats(null);
        setStories([]);
      });
  }, []);

  if (!stats && !stories.length) return null;

  const metrics = stats
    ? [
        [formatCount(stats.livesHelped), t.impactLivesHelped],
        [formatCount(stats.registeredUsers), t.impactRegisteredUsers],
        [formatCount(stats.activeRequests), t.impactActiveRequests],
        [formatCount(stats.citiesCovered), t.impactCitiesCovered],
      ]
    : [];

  return (
    <section className="border-t border-[var(--line)] bg-[linear-gradient(165deg,#1c0a0c_0%,#3a1218_55%,#6e1220_100%)] px-5 py-20 text-white md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
            {t.impactTitle}
          </h2>
          <p className="mt-3 text-white/75">{t.impactSubtitle}</p>
        </div>

        {metrics.length ? (
          <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map(([value, label]) => (
              <li key={label} className="text-center sm:text-left">
                <p className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[#ffb4b8] md:text-5xl">
                  {value}
                </p>
                <p className="mt-2 text-sm uppercase tracking-[0.12em] text-white/60">
                  {label}
                </p>
              </li>
            ))}
          </ul>
        ) : null}

        {stories.length ? (
          <div className="mt-16">
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold">
              {t.successStoriesTitle}
            </h3>
            <p className="mt-2 text-sm text-white/65">{t.successStoriesSubtitle}</p>
            <ul className="mt-8 flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
              {stories.map((s) => {
                const quote =
                  locale === "bn"
                    ? s.quoteBn || s.quoteEn
                    : s.quoteEn || s.quoteBn;
                return (
                  <li
                    key={s.id}
                    className="min-w-[85%] snap-center rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm sm:min-w-[320px]"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#2f6b4f,#d4a017)] text-sm font-bold text-white"
                      >
                        {s.name.slice(0, 1).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-semibold">{s.name}</p>
                        {s.handle ? (
                          <p className="text-xs text-white/55">{s.handle}</p>
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-white/85">
                      “{quote}”
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

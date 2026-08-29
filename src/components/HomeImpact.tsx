"use client";

import { useEffect, useRef, useState } from "react";
import { CountUp } from "@/components/CountUp";
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

const STORY_INTERVAL_MS = 4000;

export function HomeImpact() {
  const { locale, t } = useLocale();
  const [stats, setStats] = useState<ImpactStats | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [index, setIndex] = useState(0);
  const directionRef = useRef<1 | -1>(1);

  useEffect(() => {
    const ctrl = new AbortController();

    async function load() {
      try {
        const res = await fetch("/api/impact", {
          signal: ctrl.signal,
          cache: "no-store",
        });
        const data = await res.json();
        setStats(data.stats || null);
        setStories(data.stories || []);
      } catch {
        if (ctrl.signal.aborted) return;
        setStats(null);
        setStories([]);
      }
    }

    void load();
    const pollId = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 15_000);

    return () => {
      ctrl.abort();
      window.clearInterval(pollId);
    };
  }, []);

  useEffect(() => {
    setIndex(0);
    directionRef.current = 1;
  }, [stories.length]);

  useEffect(() => {
    if (stories.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((current) => {
        const dir = directionRef.current;
        const next = current + dir;
        if (next >= stories.length - 1) {
          directionRef.current = -1;
          return stories.length - 1;
        }
        if (next <= 0) {
          directionRef.current = 1;
          return 0;
        }
        return next;
      });
    }, STORY_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [stories.length]);

  if (!stats && !stories.length) return null;

  const metrics = stats
    ? [
        [stats.livesHelped, t.impactLivesHelped],
        [stats.registeredUsers, t.impactRegisteredUsers],
        [stats.activeRequests, t.impactActiveRequests],
        [stats.citiesCovered, t.impactCitiesCovered],
      ] as const
    : [];

  return (
    <section className="border-t border-[var(--line)] bg-[linear-gradient(165deg,#1c0a0c_0%,#3a1218_55%,#6e1220_100%)] px-5 py-10 text-white md:px-8 md:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold md:text-3xl">
            {t.impactTitle}
          </h2>
          <p className="mt-1.5 text-sm text-white/70">{t.impactSubtitle}</p>
        </div>

        {metrics.length ? (
          <ul className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            {metrics.map(([value, label]) => (
              <li
                key={label}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-center sm:text-left"
              >
                <p className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-[#ffb4b8] md:text-2xl">
                  <CountUp value={value} suffix={value > 0 ? "+" : ""} />
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-white/55 md:text-xs">
                  {label}
                </p>
              </li>
            ))}
          </ul>
        ) : null}

        {stories.length ? (
          <div className="mt-8">
            <h3 className="font-[family-name:var(--font-display)] text-xl font-bold md:text-2xl">
              {t.successStoriesTitle}
            </h3>
            <p className="mt-1 text-sm text-white/65">{t.successStoriesSubtitle}</p>

            <div className="relative mt-5 overflow-hidden">
              <div
                className="flex transition-transform duration-700 ease-in-out will-change-transform"
                style={{ transform: `translateX(-${index * 100}%)` }}
              >
                {stories.map((s) => {
                  const quote =
                    locale === "bn"
                      ? s.quoteBn || s.quoteEn
                      : s.quoteEn || s.quoteBn;
                  return (
                    <article
                      key={s.id}
                      className="w-full shrink-0 px-0.5 sm:px-1"
                    >
                      <div className="mx-auto max-w-xl rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm">
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
                      </div>
                    </article>
                  );
                })}
              </div>

              {stories.length > 1 ? (
                <div className="mt-4 flex justify-center gap-1.5">
                  {stories.map((s, i) => (
                    <span
                      key={s.id}
                      className={`h-1.5 rounded-full transition-all ${
                        i === index ? "w-5 bg-white" : "w-1.5 bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

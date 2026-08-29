"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DISTRICTS } from "@/lib/districts";
import { useLocale } from "@/lib/i18n/locale-context";

const LOCALE_KEY = "bloodlink_home_district";

/**
 * Homepage CTA for finding donors — no donor cards here.
 * Donors are shown on /find after "View all" (or district-filtered link).
 */
export function HomeDonors({ immersive = false }: { immersive?: boolean }) {
  const { t } = useLocale();
  const [district, setDistrict] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(LOCALE_KEY) || "";
    if (saved) setDistrict(saved);
  }, []);

  function onDistrictChange(next: string) {
    setDistrict(next);
    if (next) window.localStorage.setItem(LOCALE_KEY, next);
    else window.localStorage.removeItem(LOCALE_KEY);
  }

  const findHref = district
    ? `/find?district=${encodeURIComponent(district)}`
    : "/find";

  return (
    <section
      className={
        immersive ? "home-glass-section px-5 py-12 md:px-8 md:py-14" : "bg-[var(--mist)] px-5 py-12 md:px-8 md:py-14"
      }
    >
      <div className="mx-auto max-w-6xl">
        <div
          className={
            immersive
              ? "home-glass-panel flex flex-col gap-5 px-5 py-6 sm:flex-row sm:items-center sm:justify-between"
              : "flex flex-col gap-5 rounded-2xl border border-[var(--line)] bg-white/80 px-5 py-6 sm:flex-row sm:items-center sm:justify-between"
          }
        >
          <div>
            <h2
              className={`font-[family-name:var(--font-display)] text-2xl font-bold md:text-3xl ${
                immersive ? "home-title" : "text-[var(--blood-deep)]"
              }`}
            >
              {t.nearestDonors}
            </h2>
            <p
              className={`mt-1.5 max-w-xl text-sm ${
                immersive ? "home-muted" : "text-[color-mix(in_oklab,var(--ink)_70%,white)]"
              }`}
            >
              {t.nearestDonorsCta}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className={immersive ? "home-field min-w-44 rounded-xl px-3 py-2.5" : "field min-w-44"}
              value={district}
              onChange={(e) => onDistrictChange(e.target.value)}
              aria-label={t.district}
            >
              <option value="">{t.any}</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <Link href={findHref} className={immersive ? "btn-glass-primary" : "btn-primary"}>
              {t.viewAll}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

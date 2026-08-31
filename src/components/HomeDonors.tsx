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
export function HomeDonors() {
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
    <section className="bg-[var(--mist)] px-5 py-12 md:px-8 md:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 rounded-2xl border border-[var(--line)] bg-white/80 px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--blood-deep)] md:text-3xl">
              {t.nearestDonors}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="field min-w-44"
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
            <Link href={findHref} className="btn-glass-primary">
              {t.viewAll}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

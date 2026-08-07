"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import type { PublicDonor } from "@/lib/types";

export function HomeDonors() {
  const { t } = useLocale();
  const [donors, setDonors] = useState<PublicDonor[]>([]);

  useEffect(() => {
    fetch("/api/donors")
      .then((r) => r.json())
      .then((data) => setDonors((data.donors || []).slice(0, 6)))
      .catch(() => setDonors([]));
  }, []);

  return (
    <section className="bg-[var(--mist)] px-5 py-20 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--blood-deep)] md:text-4xl">
              {t.recentDonors}
            </h2>
            <p className="mt-2 text-[color-mix(in_oklab,var(--ink)_70%,white)]">
              {t.recentDonorsSub}
            </p>
          </div>
          <Link href="/find" className="btn-ghost">
            {t.viewAll}
          </Link>
        </div>

        {!donors.length ? (
          <p className="mt-8 text-sm text-[color-mix(in_oklab,var(--ink)_60%,white)]">
            {t.noResults}
          </p>
        ) : (
          <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {donors.map((d) => (
              <li key={d.id} className="rounded-2xl bg-white/80 px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-[family-name:var(--font-display)] text-lg font-bold">
                    {d.name}
                  </h3>
                  <span className="rounded-md bg-[var(--blood)] px-2 py-0.5 text-xs font-bold text-white">
                    {d.bloodGroup}
                  </span>
                </div>
                <p className="mt-2 text-sm">
                  {d.area}, {d.district}
                </p>
                <p className="mt-1 text-sm">
                  {d.available ? t.available : t.unavailable}
                  {d.avgRating != null
                    ? ` · ★ ${d.avgRating} (${d.ratingCount})`
                    : ""}
                </p>
                <p className="mt-2 text-xs text-[color-mix(in_oklab,var(--ink)_65%,white)]">
                  {d.bloodIssue ? d.bloodIssue : t.noBloodIssue}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

"use client";

import { useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { listAmbulances } from "@/lib/ambulances";
import { DISTRICTS } from "@/lib/districts";
import { useLocale } from "@/lib/i18n/locale-context";

export default function AmbulancePage() {
  const { t } = useLocale();
  const [district, setDistrict] = useState("");

  const items = useMemo(() => listAmbulances(district || undefined), [district]);

  return (
    <PageShell title={t.ambulanceTitle} subtitle={t.ambulanceSubtitle}>
      <div className="space-y-5 rounded-2xl bg-white/80 p-5 md:p-6">
        <label className="block max-w-md text-sm">
          <span className="mb-1 block font-medium">{t.district}</span>
          <select
            className="field"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          >
            <option value="">{t.any}</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <ul className="space-y-3">
          {items.map((a) => (
            <li
              key={a.id}
              className="rounded-xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--sand)_18%,white)] px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{a.name}</p>
                <span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold">
                  {a.type === "government" ? t.government : t.nonGovernment}
                </span>
              </div>
              {a.district ? (
                <p className="mt-1 text-sm text-[color-mix(in_oklab,var(--ink)_65%,white)]">
                  {a.district}
                </p>
              ) : (
                <p className="mt-1 text-sm text-[color-mix(in_oklab,var(--ink)_65%,white)]">
                  {t.nationwide}
                </p>
              )}
              <a
                href={`tel:${a.phone}`}
                className="mt-2 inline-flex font-[family-name:var(--font-display)] text-xl font-bold text-[var(--blood-deep)]"
              >
                {a.phone}
              </a>
              {a.note ? (
                <p className="mt-1 text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                  {a.note}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </PageShell>
  );
}

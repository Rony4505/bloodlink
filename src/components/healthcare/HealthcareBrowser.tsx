"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import type { HealthcareFacility } from "@/lib/healthcare-facilities";

type SearchResponse = {
  items: HealthcareFacility[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  districts: string[];
  upazilas: string[];
  error?: string;
};

function FacilityIcon({ category }: { category: HealthcareFacility["category"] }) {
  if (category === "diagnostic") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-[1.75]">
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path strokeLinecap="round" d="M8 8h8M8 12h5M8 16h6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-[1.75]">
      <path strokeLinejoin="round" d="M4 20V8l8-5 8 5v12H4z" />
      <path strokeLinecap="round" d="M12 11v8M9 14h6" />
    </svg>
  );
}

export function HealthcareBrowser() {
  const { t, locale } = useLocale();
  const [q, setQ] = useState("");
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");
  const [category, setCategory] = useState<"all" | "hospital" | "diagnostic">("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      page: String(page),
      limit: "24",
    });
    if (q.trim()) params.set("q", q.trim());
    if (district) params.set("district", district);
    if (upazila) params.set("upazila", upazila);
    if (category !== "all") params.set("category", category);

    try {
      const res = await fetch(`/api/healthcare/search?${params.toString()}`);
      const json = (await res.json()) as SearchResponse;
      if (!res.ok) {
        setError(json.error ?? t.healthcareLoadError);
        setData(null);
        return;
      }
      setData(json);
    } catch {
      setError(t.healthcareLoadError);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [q, district, upazila, category, page, t.healthcareLoadError]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setUpazila("");
    setPage(1);
  }, [district]);

  const facilityName = (f: HealthcareFacility) =>
    locale === "bn" && f.nameBn ? f.nameBn : f.name;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/60 bg-white/85 p-5 shadow-[0_18px_50px_rgba(110,18,32,0.08)] backdrop-blur-md md:p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="block text-sm md:col-span-2 xl:col-span-2">
            <span className="mb-1.5 block font-medium text-[var(--ink)]">{t.healthcareSearch}</span>
            <input
              className="field"
              placeholder={t.healthcareSearchPlaceholder}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-[var(--ink)]">{t.district}</span>
            <select
              className="field"
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t.any}</option>
              {(data?.districts ?? []).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-[var(--ink)]">{t.healthcareUpazila}</span>
            <select
              className="field"
              value={upazila}
              disabled={!district}
              onChange={(e) => {
                setUpazila(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t.any}</option>
              {(data?.upazilas ?? []).map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-[var(--ink)]">{t.healthcareCategory}</span>
            <select
              className="field"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as typeof category);
                setPage(1);
              }}
            >
              <option value="all">{t.adminHealthcareAll}</option>
              <option value="hospital">{t.adminHealthcareHospital}</option>
              <option value="diagnostic">{t.adminHealthcareDiagnostic}</option>
            </select>
          </label>
        </div>
      </div>

      {error ? <p className="text-sm text-[var(--blood)]">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-[color-mix(in_oklab,var(--ink)_55%,white)]">{t.loading}</p>
      ) : null}

      {!loading && data && data.items.length === 0 ? (
        <p className="rounded-xl border border-[var(--line)] bg-white/80 px-4 py-8 text-center text-sm text-[color-mix(in_oklab,var(--ink)_55%,white)]">
          {t.healthcareEmpty}
        </p>
      ) : null}

      {!loading && data && data.items.length > 0 ? (
        <>
          <p className="text-sm text-[color-mix(in_oklab,var(--ink)_60%,white)]">
            {data.total.toLocaleString()} {t.healthcareResults}
          </p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((f) => (
              <li key={f.dghsId}>
                <Link
                  href={`/healthcare/i/${f.dghsId}`}
                  className="group flex h-full flex-col rounded-2xl border border-[color-mix(in_oklab,var(--blood)_18%,white)] bg-[linear-gradient(165deg,#fffdfa_0%,#ffffff_55%,#fff5f3_100%)] p-4 shadow-[0_10px_30px_rgba(110,18,32,0.06)] transition hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--blood)_35%,white)] hover:shadow-[0_16px_40px_rgba(110,18,32,0.12)]"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(145deg,#9b1b2e,#6e1220)] text-white shadow-md">
                      <FacilityIcon category={f.category} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-[family-name:var(--font-display)] text-base font-bold leading-snug text-[var(--ink)] group-hover:text-[var(--blood-deep)]">
                        {facilityName(f)}
                      </p>
                      <p className="mt-1 text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                        {f.type}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[var(--cream)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                      {f.category === "hospital"
                        ? t.adminHealthcareHospital
                        : t.adminHealthcareDiagnostic}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                      {f.isPrivate ? t.adminHealthcarePrivate : t.adminHealthcareGov}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-[color-mix(in_oklab,var(--ink)_65%,white)]">
                    {[f.upazila, f.district].filter(Boolean).join(", ")}
                  </p>
                  {f.phone ? (
                    <p className="mt-2 font-[family-name:var(--font-display)] text-lg font-bold text-[var(--blood-deep)]">
                      {f.phone}
                    </p>
                  ) : null}
                  <span className="btn-glass-primary mt-4 inline-flex w-full justify-center text-sm">
                    {t.healthcareViewDetails}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-white/80 px-4 py-3">
            <p className="text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
              {t.adminHealthcarePage} {data.page}/{data.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-ghost"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ←
              </button>
              <button
                type="button"
                className="btn-ghost"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                →
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

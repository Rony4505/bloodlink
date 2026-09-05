"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";

type CompanySummary = {
  id: string;
  slug?: string;
  name: string;
  nameBn: string;
  contactPhone: string;
  district: string;
  upazila: string;
  doctorCount: number;
};

type SearchResponse = {
  items: unknown[];
  companies?: CompanySummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  districts: string[];
  upazilas: string[];
  error?: string;
};

export function HealthcareBrowser() {
  const { t, locale } = useLocale();
  const [q, setQ] = useState("");
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (district) params.set("district", district);
    if (upazila) params.set("upazila", upazila);

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
  }, [q, district, upazila, t.healthcareLoadError]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, q.trim() ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [load, q]);

  useEffect(() => {
    setUpazila("");
  }, [district]);

  const companies = data?.companies ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/60 bg-white/85 p-5 shadow-[0_18px_50px_rgba(110,18,32,0.08)] backdrop-blur-md md:p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="block text-sm md:col-span-2 xl:col-span-2">
            <span className="mb-1.5 block font-medium text-[var(--ink)]">{t.healthcareSearch}</span>
            <input
              className="field"
              placeholder={t.healthcareSearchPlaceholder}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-[var(--ink)]">{t.district}</span>
            <select
              className="field"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
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
              onChange={(e) => setUpazila(e.target.value)}
            >
              <option value="">{t.any}</option>
              {(data?.upazilas ?? []).map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error ? <p className="text-sm text-[var(--blood)]">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-[color-mix(in_oklab,var(--ink)_55%,white)]">{t.loading}</p>
      ) : null}

      {!loading && companies.length > 0 ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--blood-deep)]">
              {t.healthcareRegisteredProviders}
            </h3>
            <p className="text-sm text-[color-mix(in_oklab,var(--ink)_60%,white)]">
              {companies.length.toLocaleString()} {t.healthcareResults}
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/healthcare/c/${encodeURIComponent(c.slug || c.id)}`}
                  className="group flex h-full flex-col rounded-2xl border border-[color-mix(in_oklab,var(--blood)_22%,white)] bg-[linear-gradient(165deg,#fff5f8_0%,#ffffff_60%,#fffdfa_100%)] p-4 shadow-[0_10px_30px_rgba(110,18,32,0.06)] transition hover:-translate-y-0.5"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--blood)]">
                    {t.healthcareRegisteredProvider}
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-display)] text-base font-bold text-[var(--ink)] group-hover:text-[var(--blood-deep)]">
                    {locale === "bn" && c.nameBn ? c.nameBn : c.name}
                  </p>
                  <p className="mt-2 text-sm text-[color-mix(in_oklab,var(--ink)_65%,white)]">
                    {[c.upazila, c.district].filter(Boolean).join(", ")}
                  </p>
                  <p className="mt-2 text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                    {c.doctorCount} {t.healthcareDoctors.toLowerCase()}
                  </p>
                  {c.contactPhone ? (
                    <p className="mt-2 font-bold text-[var(--blood-deep)]">{c.contactPhone}</p>
                  ) : null}
                  <span className="btn-glass-primary mt-4 inline-flex w-full justify-center text-sm">
                    {t.healthcareViewDetails}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!loading && data && companies.length === 0 ? (
        <p className="rounded-xl border border-[var(--line)] bg-white/80 px-4 py-8 text-center text-sm text-[color-mix(in_oklab,var(--ink)_55%,white)]">
          {t.healthcareEmpty}
        </p>
      ) : null}
    </div>
  );
}

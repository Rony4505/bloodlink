"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import type { HealthcareFacility } from "@/lib/healthcare-facilities";

type Meta = {
  source: string;
  sourceUrl: string;
  importedAt: string;
  total: number;
  hospitals: number;
  diagnostics: number;
};

type ApiResponse = {
  items: HealthcareFacility[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  meta: Meta;
  districts: string[];
  divisions: string[];
  error?: string;
};

export function AdminHealthcarePanel() {
  const { t } = useLocale();
  const [q, setQ] = useState("");
  const [district, setDistrict] = useState("");
  const [division, setDivision] = useState("");
  const [category, setCategory] = useState<"all" | "hospital" | "diagnostic">("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      page: String(page),
      limit: "50",
    });
    if (q.trim()) params.set("q", q.trim());
    if (district) params.set("district", district);
    if (division) params.set("division", division);
    if (category !== "all") params.set("category", category);

    try {
      const res = await fetch(`/api/admin/healthcare?${params.toString()}`);
      const json = (await res.json()) as ApiResponse;
      if (!res.ok) {
        setError(json.error ?? "Failed to load");
        setData(null);
        return;
      }
      setData(json);
    } catch {
      setError("Failed to load healthcare facilities");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [q, district, division, category, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const importedLabel = useMemo(() => {
    if (!data?.meta.importedAt) return "—";
    try {
      return new Date(data.meta.importedAt).toLocaleString();
    } catch {
      return data.meta.importedAt;
    }
  }, [data?.meta.importedAt]);

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white/90 shadow-sm">
      <div className="border-b border-[var(--line)] bg-[linear-gradient(160deg,#fff8f4,#ffffff)] px-5 py-4">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--blood-deep)]">
          {t.adminHealthcare}
        </h2>
        <p className="mt-1 text-sm text-[color-mix(in_oklab,var(--ink)_58%,white)]">
          {t.adminHealthcareHint}
        </p>
        <p className="mt-2 text-xs text-[color-mix(in_oklab,var(--ink)_45%,white)]">
          {t.adminHealthcareAdminOnly}
        </p>
        {data?.meta ? (
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <span className="rounded-full bg-[var(--cream)] px-3 py-1">
              {t.adminHealthcareTotal}: <strong>{data.meta.total.toLocaleString()}</strong>
            </span>
            <span className="rounded-full bg-[var(--cream)] px-3 py-1">
              {t.adminHealthcareHospital}: <strong>{data.meta.hospitals.toLocaleString()}</strong>
            </span>
            <span className="rounded-full bg-[var(--cream)] px-3 py-1">
              {t.adminHealthcareDiagnostic}:{" "}
              <strong>{data.meta.diagnostics.toLocaleString()}</strong>
            </span>
            <span className="rounded-full bg-[var(--cream)] px-3 py-1">
              {t.adminHealthcareImported}: <strong>{importedLabel}</strong>
            </span>
            <a
              href={data.meta.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-[var(--cream)] px-3 py-1 underline"
            >
              {t.adminHealthcareSource}: DGHS
            </a>
          </div>
        ) : null}
      </div>

      <div className="space-y-4 p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            className="input md:col-span-2 xl:col-span-2"
            placeholder={t.adminHealthcareSearch}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
          <select
            className="input"
            value={division}
            onChange={(e) => {
              setDivision(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t.adminHealthcareDivision}</option>
            {(data?.divisions ?? []).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t.adminHealthcareDistrict}</option>
            {(data?.districts ?? []).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            className="input"
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
        </div>

        {error ? <p className="text-sm text-[var(--blood)]">{error}</p> : null}
        {loading ? <p className="text-sm text-[color-mix(in_oklab,var(--ink)_55%,white)]">{t.loading}</p> : null}

        {!loading && data && data.items.length === 0 ? (
          <p className="text-sm text-[color-mix(in_oklab,var(--ink)_55%,white)]">{t.adminHealthcareEmpty}</p>
        ) : null}

        {!loading && data && data.items.length > 0 ? (
          <>
            <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[var(--cream)] text-xs uppercase tracking-wide text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                  <tr>
                    <th className="px-3 py-2">{t.adminHealthcareName}</th>
                    <th className="px-3 py-2">{t.adminHealthcareType}</th>
                    <th className="px-3 py-2">{t.adminHealthcareContact}</th>
                    <th className="px-3 py-2">{t.adminHealthcareAddress}</th>
                    <th className="px-3 py-2">{t.adminHealthcareDistrict}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((f) => (
                    <tr key={f.dghsId} className="border-t border-[var(--line)] align-top">
                      <td className="px-3 py-3">
                        <div className="font-medium text-[var(--ink)]">{f.name}</div>
                        {f.nameBn ? (
                          <div className="mt-0.5 text-xs text-[color-mix(in_oklab,var(--ink)_60%,white)]">
                            {f.nameBn}
                          </div>
                        ) : null}
                        <div className="mt-1 text-[10px] uppercase tracking-wide text-[color-mix(in_oklab,var(--ink)_45%,white)]">
                          {f.isPrivate ? t.adminHealthcarePrivate : t.adminHealthcareGov} · {f.code}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs">{f.type}</td>
                      <td className="px-3 py-3 text-xs">
                        {f.email ? (
                          <a className="break-all underline" href={`mailto:${f.email}`}>
                            {f.email}
                          </a>
                        ) : (
                          "—"
                        )}
                        {f.phone ? <div className="mt-1">{f.phone}</div> : null}
                      </td>
                      <td className="max-w-xs px-3 py-3 text-xs">{f.address || "—"}</td>
                      <td className="px-3 py-3 text-xs">
                        <div>{f.district}</div>
                        <div className="text-[color-mix(in_oklab,var(--ink)_55%,white)]">{f.division}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                {data.total.toLocaleString()} {t.adminHealthcareTotal.toLowerCase()} · {t.adminHealthcarePage}{" "}
                {data.page}/{data.totalPages}
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
    </section>
  );
}

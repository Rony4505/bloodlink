"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import type { VisitorAnalyticsPeriod, VisitorAnalyticsSummary } from "@/lib/visitor-analytics";

type ApiResponse = {
  analytics: VisitorAnalyticsSummary;
  error?: string;
};

const PERIODS: VisitorAnalyticsPeriod[] = ["today", "7d", "30d"];

function periodLabel(period: VisitorAnalyticsPeriod, t: ReturnType<typeof useLocale>["t"]) {
  if (period === "today") return t.adminAnalyticsToday;
  if (period === "7d") return t.adminAnalytics7d;
  return t.adminAnalytics30d;
}

export function AdminAnalyticsPanel() {
  const { t } = useLocale();
  const [period, setPeriod] = useState<VisitorAnalyticsPeriod>("today");
  const [data, setData] = useState<VisitorAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`);
      const json = (await res.json()) as ApiResponse;
      if (!res.ok) {
        setError(json.error ?? t.adminAnalyticsLoadFailed);
        setData(null);
        return;
      }
      setData(json.analytics);
    } catch {
      setError(t.adminAnalyticsLoadFailed);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period, t.adminAnalyticsLoadFailed]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white/90 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-[linear-gradient(160deg,#fff8f4,#ffffff)] px-5 py-4">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--blood-deep)]">
            {t.adminAnalytics}
          </h2>
          <p className="mt-1 text-xs text-[color-mix(in_oklab,var(--ink)_58%,white)]">
            {t.adminAnalyticsHint}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              className={period === p ? "btn-primary" : "btn-ghost"}
              onClick={() => setPeriod(p)}
            >
              {periodLabel(p, t)}
            </button>
          ))}
          <button type="button" className="btn-ghost" onClick={() => void load()} disabled={loading}>
            {loading ? t.loading : t.adminAnalyticsRefresh}
          </button>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {error ? (
          <p className="rounded-xl bg-[color-mix(in_oklab,var(--blood)_10%,white)] px-4 py-3 text-sm text-[var(--blood-deep)]">
            {error}
          </p>
        ) : null}

        {data ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-[var(--cream)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color-mix(in_oklab,var(--ink)_50%,white)]">
                  {t.adminAnalyticsPageViews}
                </p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--blood-deep)]">
                  {data.pageViews.toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl bg-[var(--cream)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color-mix(in_oklab,var(--ink)_50%,white)]">
                  {t.adminAnalyticsUnique}
                </p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--blood-deep)]">
                  {data.uniqueVisitors.toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl bg-[var(--cream)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color-mix(in_oklab,var(--ink)_50%,white)]">
                  {t.adminAnalyticsLoggedIn}
                </p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--blood-deep)]">
                  {data.loggedInViews.toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl bg-[var(--cream)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color-mix(in_oklab,var(--ink)_50%,white)]">
                  {t.adminAnalyticsDistricts}
                </p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--blood-deep)]">
                  {data.byDistrict.length.toLocaleString()}
                </p>
              </div>
            </div>

            <p className="text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
              {t.adminAnalyticsPrivacyNote}
            </p>

            <div className="grid gap-5 xl:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-[var(--line)]">
                <div className="border-b border-[var(--line)] bg-[var(--cream)] px-4 py-3">
                  <h3 className="text-sm font-bold text-[var(--blood-deep)]">
                    {t.adminAnalyticsByDistrict}
                  </h3>
                </div>
                {!data.byDistrict.length ? (
                  <p className="px-4 py-6 text-sm text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                    {t.adminAnalyticsEmpty}
                  </p>
                ) : (
                  <div className="max-h-80 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white text-[10px] uppercase tracking-wide text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                        <tr>
                          <th className="px-4 py-2 text-left">{t.adminHealthcareDistrict}</th>
                          <th className="px-4 py-2 text-right">{t.adminAnalyticsPageViews}</th>
                          <th className="px-4 py-2 text-right">{t.adminAnalyticsUnique}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.byDistrict.map((row) => (
                          <tr key={row.district} className="border-t border-[var(--line)]">
                            <td className="px-4 py-2 font-medium">{row.district}</td>
                            <td className="px-4 py-2 text-right">{row.views.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right">{row.unique.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="overflow-hidden rounded-2xl border border-[var(--line)]">
                <div className="border-b border-[var(--line)] bg-[var(--cream)] px-4 py-3">
                  <h3 className="text-sm font-bold text-[var(--blood-deep)]">
                    {t.adminAnalyticsTopPages}
                  </h3>
                </div>
                {!data.topPages.length ? (
                  <p className="px-4 py-6 text-sm text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                    {t.adminAnalyticsEmpty}
                  </p>
                ) : (
                  <div className="max-h-80 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white text-[10px] uppercase tracking-wide text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                        <tr>
                          <th className="px-4 py-2 text-left">{t.adminAnalyticsPage}</th>
                          <th className="px-4 py-2 text-right">{t.adminAnalyticsPageViews}</th>
                          <th className="px-4 py-2 text-right">{t.adminAnalyticsUnique}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.topPages.map((row) => (
                          <tr key={row.path} className="border-t border-[var(--line)]">
                            <td className="px-4 py-2 font-mono text-xs">{row.path}</td>
                            <td className="px-4 py-2 text-right">{row.views.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right">{row.unique.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[var(--line)]">
              <div className="border-b border-[var(--line)] bg-[var(--cream)] px-4 py-3">
                <h3 className="text-sm font-bold text-[var(--blood-deep)]">
                  {t.adminAnalyticsRecent}
                </h3>
              </div>
              {!data.recent.length ? (
                <p className="px-4 py-6 text-sm text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                  {t.adminAnalyticsEmpty}
                </p>
              ) : (
                <div className="max-h-96 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white text-[10px] uppercase tracking-wide text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                      <tr>
                        <th className="px-4 py-2 text-left">{t.adminAnalyticsWhen}</th>
                        <th className="px-4 py-2 text-left">{t.adminAnalyticsPage}</th>
                        <th className="px-4 py-2 text-left">{t.adminHealthcareDistrict}</th>
                        <th className="px-4 py-2 text-left">{t.adminAnalyticsCity}</th>
                        <th className="px-4 py-2 text-left">{t.adminAnalyticsUser}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent.map((row) => (
                        <tr key={row.id} className="border-t border-[var(--line)]">
                          <td className="px-4 py-2 whitespace-nowrap text-xs">
                            {new Date(row.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-2 font-mono text-xs">{row.path}</td>
                          <td className="px-4 py-2">{row.district ?? "—"}</td>
                          <td className="px-4 py-2">{row.city ?? "—"}</td>
                          <td className="px-4 py-2">
                            {row.loggedIn ? t.adminAnalyticsLoggedInBadge : t.adminAnalyticsGuest}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : loading ? (
          <p className="text-sm text-[color-mix(in_oklab,var(--ink)_55%,white)]">{t.loading}</p>
        ) : null}
      </div>
    </section>
  );
}

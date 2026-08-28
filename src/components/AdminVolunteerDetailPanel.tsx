"use client";

import { useCallback, useEffect, useState } from "react";
import { VolunteerVerbalUrlCard } from "@/components/VolunteerVerbalUrlCard";
import { useLocale } from "@/lib/i18n/locale-context";

type DonorRow = {
  id: string;
  name: string;
  bloodGroup: string;
  district: string;
  area: string;
  createdAt: string;
  addedLabel: string;
  volunteerSource: "link" | "manual" | null;
  volunteerApproved: boolean;
};

type DetailData = {
  volunteer: {
    id: string;
    name: string;
    role: string;
    district: string;
    linkToken: string;
  };
  stats: {
    totalApproved: number;
    pendingManual: number;
    filteredCount: number;
    activityCount: number;
    date: string | null;
  };
  dayCounts: Record<string, number>;
  donors: DonorRow[];
};

type Props = {
  volunteerId: string;
  portalUrl: string;
  onClose: () => void;
  onNotify: (volunteerId: string, name: string) => void;
};

export function AdminVolunteerDetailPanel({
  volunteerId,
  portalUrl,
  onClose,
  onNotify,
}: Props) {
  const { t } = useLocale();
  const [date, setDate] = useState("");
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ volunteerId });
    if (date) params.set("date", date);
    const res = await fetch(`/api/admin/volunteer-work?${params.toString()}`);
    if (!res.ok) {
      setData(null);
      setLoading(false);
      return;
    }
    setData((await res.json()) as DetailData);
    setLoading(false);
  }, [volunteerId, date]);

  useEffect(() => {
    void load();
  }, [load]);

  const recentDays = Object.entries(data?.dayCounts || {})
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 10);

  return (
    <section className="rounded-2xl border-2 border-[color-mix(in_oklab,var(--blood)_25%,white)] bg-white p-5 shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--blood-deep)]">
            {t.volunteerDetailTitle}
          </p>
          <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]">
            {data?.volunteer.name || t.loading}
          </h3>
          {data ? (
            <p className="text-sm text-[color-mix(in_oklab,var(--ink)_65%,white)]">
              {data.volunteer.role}
              {data.volunteer.district ? ` · ${data.volunteer.district}` : ""}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {data ? (
            <button
              type="button"
              className="btn-primary px-3 py-1.5 text-xs"
              onClick={() => onNotify(data.volunteer.id, data.volunteer.name)}
            >
              {t.volunteerSendNotify}
            </button>
          ) : null}
          <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={onClose}>
            {t.close}
          </button>
        </div>
      </div>

      {loading && !data ? (
        <p className="mt-4 text-sm">{t.loading}</p>
      ) : data ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-[var(--cream)] px-3 py-3 text-center">
              <p className="text-2xl font-bold text-[var(--blood-deep)]">
                {data.stats.totalApproved}
              </p>
              <p className="text-[10px] uppercase tracking-wide opacity-70">
                {t.volunteerTotalWorkCount}
              </p>
            </div>
            <div className="rounded-xl bg-[var(--cream)] px-3 py-3 text-center">
              <p className="text-2xl font-bold">
                {date ? data.stats.filteredCount : "—"}
              </p>
              <p className="text-[10px] uppercase tracking-wide opacity-70">
                {t.volunteerDayCount}
              </p>
            </div>
            <div className="rounded-xl bg-[var(--cream)] px-3 py-3 text-center">
              <p className="text-2xl font-bold">{data.stats.pendingManual}</p>
              <p className="text-[10px] uppercase tracking-wide opacity-70">
                {t.volunteerPendingApproval}
              </p>
            </div>
            <div className="rounded-xl bg-[var(--cream)] px-3 py-3 text-center">
              <p className="text-2xl font-bold">{data.stats.activityCount}</p>
              <p className="text-[10px] uppercase tracking-wide opacity-70">
                {t.volunteerActivities}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <VolunteerVerbalUrlCard
              kind="work"
              token={data.volunteer.linkToken}
              origin={portalUrl}
              compact
            />
            <VolunteerVerbalUrlCard
              kind="join"
              token={data.volunteer.linkToken}
              origin={portalUrl}
              compact
            />
          </div>

          <div className="mt-5 flex flex-wrap items-end gap-3">
            <label className="flex-1 text-sm">
              <span className="mb-1 block font-medium">{t.volunteerSearchByDate}</span>
              <input
                type="date"
                className="field"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            {date ? (
              <button type="button" className="btn-ghost" onClick={() => setDate("")}>
                {t.volunteerClearDate}
              </button>
            ) : null}
          </div>

          {recentDays.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {recentDays.map(([day, count]) => (
                <button
                  key={day}
                  type="button"
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    date === day ? "bg-[var(--blood)] text-white" : "bg-[var(--cream)]"
                  }`}
                  onClick={() => setDate(day)}
                >
                  {day} · {count}
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-5">
            <h4 className="font-semibold text-[var(--blood-deep)]">
              {t.volunteerWorkDetailsTitle}
            </h4>
            {!data.donors.length ? (
              <p className="mt-2 text-sm text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                {t.volunteerDonorListEmpty}
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {data.donors.map((d) => (
                  <li
                    key={d.id}
                    className="rounded-xl border border-[var(--line)] bg-[var(--cream)]/50 px-3 py-2 text-sm"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <div>
                        <p className="font-semibold">{d.name}</p>
                        <p className="text-xs text-[color-mix(in_oklab,var(--ink)_60%,white)]">
                          {d.bloodGroup} · {d.area ? `${d.area}, ` : ""}
                          {d.district}
                        </p>
                      </div>
                      <div className="text-right text-xs">
                        <p>{d.addedLabel}</p>
                        {d.volunteerSource === "manual" && !d.volunteerApproved ? (
                          <span className="text-amber-800">{t.volunteerPendingApproval}</span>
                        ) : (
                          <span className="text-emerald-800">{t.volunteerCountedWork}</span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}

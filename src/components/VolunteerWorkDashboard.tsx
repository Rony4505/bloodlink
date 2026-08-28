"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PasswordField } from "@/components/PasswordField";
import { areasForDistrict } from "@/lib/district-areas";
import { BLOOD_GROUPS, DISTRICTS } from "@/lib/districts";
import { useLocale } from "@/lib/i18n/locale-context";
import { volunteerJoinUrl } from "@/lib/volunteer-urls";

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

type DashboardData = {
  volunteer: {
    name: string;
    district: string;
    role: string;
    notificationsEnabled: boolean;
  };
  stats: {
    totalListed: number;
    totalApproved: number;
    pendingManual: number;
    filteredCount: number;
    date: string | null;
  };
  dayCounts: Record<string, number>;
  donors: DonorRow[];
  publicKey: string | null;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export function VolunteerWorkDashboard({ token }: { token: string }) {
  const { t } = useLocale();
  const [data, setData] = useState<DashboardData | null>(null);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [manual, setManual] = useState({
    name: "",
    phone: "",
    gender: "male",
    bloodGroup: "O+",
    district: "Dhaka",
    area: "",
    tempPassword: "",
  });

  const joinUrl = useMemo(() => {
    if (typeof window === "undefined") return volunteerJoinUrl(token);
    return volunteerJoinUrl(token, window.location.origin);
  }, [token]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    const res = await fetch(
      `/api/public/volunteer/${encodeURIComponent(token)}?${params.toString()}`,
    );
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || t.errorGeneric);
      setData(null);
      setLoading(false);
      return;
    }
    setData(json as DashboardData);
    setLoading(false);
  }, [token, date, t.errorGeneric]);

  useEffect(() => {
    void load();
  }, [load]);

  async function copyJoinUrl() {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setMessage(t.volunteerUrlCopied);
    } catch {
      window.prompt(t.volunteerCopyUrl, joinUrl);
    }
  }

  async function enablePush() {
    if (!data?.publicKey) {
      setError(t.volunteerPushUnavailable);
      return;
    }
    setPushBusy(true);
    setError("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setError(t.volunteerPushDenied);
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey),
      });
      const body = sub.toJSON();
      const res = await fetch(
        `/api/public/volunteer/${encodeURIComponent(token)}/push`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        setError(t.errorGeneric);
        return;
      }
      setMessage(t.volunteerPushEnabled);
    } catch {
      setError(t.volunteerPushUnavailable);
    } finally {
      setPushBusy(false);
    }
  }

  async function submitManual(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    const res = await fetch(
      `/api/public/volunteer/${encodeURIComponent(token)}/donors`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manual),
      },
    );
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || t.errorGeneric);
      return;
    }
    setMessage(t.volunteerManualSaved);
    setShowManual(false);
    setManual({
      name: "",
      phone: "",
      gender: "male",
      bloodGroup: "O+",
      district: "Dhaka",
      area: "",
      tempPassword: "",
    });
    void load();
  }

  if (loading && !data) {
    return (
      <p className="text-sm text-[color-mix(in_oklab,var(--ink)_60%,white)]">{t.loading}</p>
    );
  }

  if (error && !data) {
    return <p className="text-sm text-[var(--blood)]">{error}</p>;
  }

  if (!data) return null;

  const areaOptions = areasForDistrict(manual.district);
  const recentDays = Object.entries(data.dayCounts)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 7);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="rounded-3xl bg-[linear-gradient(145deg,var(--blood-deep),#6b1424)] px-6 py-7 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
          {t.volunteerWorkBoard}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold">
          {data.volunteer.name}
        </h1>
        <p className="mt-1 text-sm text-white/85">
          {data.volunteer.role}
          {data.volunteer.district ? ` · ${data.volunteer.district}` : ""}
        </p>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white/10 px-3 py-3 text-center backdrop-blur">
            <p className="text-2xl font-bold">{data.stats.totalApproved}</p>
            <p className="text-[10px] uppercase tracking-wide text-white/75">
              {t.volunteerCountedWork}
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-3 text-center backdrop-blur">
            <p className="text-2xl font-bold">
              {date ? data.stats.filteredCount : "—"}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-white/75">
              {t.volunteerDayCount}
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-3 text-center backdrop-blur">
            <p className="text-2xl font-bold">{data.stats.pendingManual}</p>
            <p className="text-[10px] uppercase tracking-wide text-white/75">
              {t.volunteerPendingApproval}
            </p>
          </div>
        </div>
      </header>

      {error ? <p className="text-sm text-[var(--blood)]">{error}</p> : null}
      {message ? <p className="text-sm text-[var(--sage)]">{message}</p> : null}

      <section className="rounded-2xl border border-[var(--line)] bg-white/90 p-5 shadow-sm">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--blood-deep)]">
          {t.volunteerDonorLinkTitle}
        </h2>
        <p className="mt-1 text-sm text-[color-mix(in_oklab,var(--ink)_58%,white)]">
          {t.volunteerDonorLinkHint}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <code className="block flex-1 break-all rounded-xl bg-[var(--cream)] px-3 py-2 text-xs">
            {joinUrl}
          </code>
          <button type="button" className="btn-primary" onClick={() => void copyJoinUrl()}>
            {t.volunteerCopyUrl}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-white/90 p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex-1 text-sm">
            <span className="mb-1 block font-medium">{t.volunteerSearchByDate}</span>
            <input
              type="date"
              className="input w-full"
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
          <div className="mt-4 flex flex-wrap gap-2">
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
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-white/90 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
            {t.volunteerDonorListTitle}
          </h2>
          <button type="button" className="btn-ghost" onClick={() => setShowManual((v) => !v)}>
            {showManual ? t.volunteerHideManual : t.volunteerManualAdd}
          </button>
        </div>

        {showManual ? (
          <form onSubmit={(e) => void submitManual(e)} className="mt-4 grid gap-3 border-t border-[var(--line)] pt-4">
            <p className="text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
              {t.volunteerManualHint}
            </p>
            <input
              className="input"
              placeholder={t.name}
              value={manual.name}
              onChange={(e) => setManual((m) => ({ ...m, name: e.target.value }))}
              required
            />
            <input
              className="input"
              placeholder={t.phone}
              value={manual.phone}
              onChange={(e) => setManual((m) => ({ ...m, phone: e.target.value }))}
              required
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                className="input"
                value={manual.bloodGroup}
                onChange={(e) => setManual((m) => ({ ...m, bloodGroup: e.target.value }))}
              >
                {BLOOD_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <select
                className="input"
                value={manual.district}
                onChange={(e) =>
                  setManual((m) => ({ ...m, district: e.target.value, area: "" }))
                }
              >
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <input
              className="input"
              list="volunteer-areas"
              placeholder={t.area}
              value={manual.area}
              onChange={(e) => setManual((m) => ({ ...m, area: e.target.value }))}
              required
            />
            <datalist id="volunteer-areas">
              {areaOptions.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
            <PasswordField
              label={t.volunteerTempPassword}
              value={manual.tempPassword}
              onChange={(tempPassword) => setManual((m) => ({ ...m, tempPassword }))}
              autoComplete="new-password"
            />
            <button type="submit" className="btn-primary">
              {t.volunteerSaveManual}
            </button>
          </form>
        ) : null}

        {!data.donors.length ? (
          <p className="mt-4 text-sm text-[color-mix(in_oklab,var(--ink)_55%,white)]">
            {t.volunteerDonorListEmpty}
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {data.donors.map((d) => (
              <li
                key={d.id}
                className="rounded-xl border border-[var(--line)] bg-[var(--cream)]/60 px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[var(--ink)]">{d.name}</p>
                    <p className="text-sm text-[var(--blood-deep)]">{d.bloodGroup}</p>
                    <p className="text-xs text-[color-mix(in_oklab,var(--ink)_58%,white)]">
                      {d.area ? `${d.area}, ` : ""}
                      {d.district}
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="text-[color-mix(in_oklab,var(--ink)_55%,white)]">{d.addedLabel}</p>
                    {d.volunteerSource === "manual" && !d.volunteerApproved ? (
                      <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-amber-900">
                        {t.volunteerPendingApproval}
                      </span>
                    ) : (
                      <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-900">
                        {t.volunteerCountedWork}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {data.volunteer.notificationsEnabled && data.publicKey ? (
        <section className="rounded-2xl border border-[var(--line)] bg-white/90 p-5 shadow-sm">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
            {t.volunteerNotificationsTitle}
          </h2>
          <p className="mt-1 text-sm text-[color-mix(in_oklab,var(--ink)_58%,white)]">
            {t.volunteerNotificationsHint}
          </p>
          <button
            type="button"
            className="btn-primary mt-3"
            disabled={pushBusy}
            onClick={() => void enablePush()}
          >
            {pushBusy ? t.loading : t.volunteerEnablePush}
          </button>
        </section>
      ) : null}
    </div>
  );
}

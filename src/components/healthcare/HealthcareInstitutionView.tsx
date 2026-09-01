"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import type { HealthcareFacility } from "@/lib/healthcare-facilities";
import type { HealthcareDoctorSchedule } from "@/lib/healthcare-platform";

type DoctorSummary = {
  id: string;
  name: string;
  nameBn: string;
  specialty: string;
  specialtyBn: string;
  phone: string;
  room: string;
  schedules: HealthcareDoctorSchedule[];
};

type InstitutionResponse = {
  facility: HealthcareFacility;
  doctors: DoctorSummary[];
  error?: string;
};

const WEEKDAY_KEYS = [
  "healthcareWeekSun",
  "healthcareWeekMon",
  "healthcareWeekTue",
  "healthcareWeekWed",
  "healthcareWeekThu",
  "healthcareWeekFri",
  "healthcareWeekSat",
] as const;

function formatSchedule(
  schedules: HealthcareDoctorSchedule[],
  weekdayLabel: (weekday: number) => string,
) {
  if (!schedules.length) return "—";
  return schedules
    .map((s) => `${weekdayLabel(s.weekday)} ${s.startTime}–${s.endTime}`)
    .join(" · ");
}

export function HealthcareInstitutionView({ dghsId }: { dghsId: string }) {
  const { t, locale } = useLocale();
  const [data, setData] = useState<InstitutionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [bookError, setBookError] = useState("");

  const weekdayLabel = useCallback(
    (weekday: number) => {
      const key = WEEKDAY_KEYS[weekday] ?? WEEKDAY_KEYS[0];
      return t[key];
    },
    [t],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/healthcare/institution/${dghsId}`);
      const json = (await res.json()) as InstitutionResponse;
      if (!res.ok) {
        setError(json.error ?? t.healthcareLoadError);
        setData(null);
        return;
      }
      setData(json);
      if (json.doctors.length === 1) setDoctorId(json.doctors[0].id);
    } catch {
      setError(t.healthcareLoadError);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [dghsId, t.healthcareLoadError]);

  useEffect(() => {
    void load();
  }, [load]);

  const facility = data?.facility;
  const doctors = data?.doctors ?? [];

  const facilityName = useMemo(() => {
    if (!facility) return "";
    return locale === "bn" && facility.nameBn ? facility.nameBn : facility.name;
  }, [facility, locale]);

  const doctorLabel = (d: DoctorSummary) => {
    const name = locale === "bn" && d.nameBn ? d.nameBn : d.name;
    const specialty = locale === "bn" && d.specialtyBn ? d.specialtyBn : d.specialty;
    return specialty ? `${name} — ${specialty}` : name;
  };

  async function submitBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!facility) return;
    setBooking(true);
    setBookError("");
    try {
      const res = await fetch("/api/healthcare/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId,
          dghsId: facility.dghsId,
          patientName,
          patientPhone,
          scheduledAt,
          notes,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setBookError(json.error ?? t.healthcareBookError);
        return;
      }
      setBooked(true);
      setPatientName("");
      setPatientPhone("");
      setScheduledAt("");
      setNotes("");
    } catch {
      setBookError(t.healthcareBookError);
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-[color-mix(in_oklab,var(--ink)_55%,white)]">{t.loading}</p>;
  }

  if (error || !facility) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-white/85 p-6 text-center">
        <p className="text-sm text-[var(--blood)]">{error || t.healthcareNotFound}</p>
        <Link href="/healthcare" className="btn-glass-secondary mt-4 inline-flex">
          {t.healthcareBack}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/healthcare"
        className="inline-flex items-center gap-1 text-sm font-medium text-[var(--blood-deep)] underline-offset-4 hover:underline"
      >
        ← {t.healthcareBack}
      </Link>

      <section className="overflow-hidden rounded-2xl border border-white/60 bg-white/90 shadow-[0_18px_50px_rgba(110,18,32,0.08)]">
        <div className="border-b border-[var(--line)] bg-[linear-gradient(160deg,#fff8f4,#ffffff)] px-5 py-5 md:px-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--blood)]">
            {facility.category === "hospital"
              ? t.adminHealthcareHospital
              : t.adminHealthcareDiagnostic}
            {" · "}
            {facility.isPrivate ? t.adminHealthcarePrivate : t.adminHealthcareGov}
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)] md:text-3xl">
            {facilityName}
          </h2>
          <p className="mt-1 text-sm text-[color-mix(in_oklab,var(--ink)_60%,white)]">{facility.type}</p>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2 md:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color-mix(in_oklab,var(--ink)_50%,white)]">
              {t.adminHealthcareAddress}
            </p>
            <p className="mt-1 text-sm">{facility.address || "—"}</p>
            <p className="mt-2 text-sm text-[color-mix(in_oklab,var(--ink)_65%,white)]">
              {[facility.upazila, facility.district, facility.division].filter(Boolean).join(", ")}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color-mix(in_oklab,var(--ink)_50%,white)]">
              {t.adminHealthcareContact}
            </p>
            {facility.phone ? (
              <a
                href={`tel:${facility.phone}`}
                className="mt-2 inline-flex font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--blood-deep)]"
              >
                {facility.phone}
              </a>
            ) : (
              <p className="mt-1 text-sm">—</p>
            )}
            {facility.email ? (
              <a className="mt-2 block break-all text-sm underline" href={`mailto:${facility.email}`}>
                {facility.email}
              </a>
            ) : null}
            {facility.phone ? (
              <a href={`tel:${facility.phone}`} className="btn-glass-primary mt-4 inline-flex">
                {t.healthcareCallNow}
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-white/85 p-5 md:p-6">
        <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--blood-deep)]">
          {t.healthcareDoctors}
        </h3>
        <p className="mt-1 text-sm text-[color-mix(in_oklab,var(--ink)_60%,white)]">
          {t.healthcareDoctorsHint}
        </p>

        {doctors.length === 0 ? (
          <p className="mt-4 rounded-xl bg-[var(--cream)] px-4 py-3 text-sm text-[color-mix(in_oklab,var(--ink)_60%,white)]">
            {t.healthcareNoDoctors}
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {doctors.map((d) => (
              <li
                key={d.id}
                className="rounded-xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--sand)_15%,white)] px-4 py-3"
              >
                <p className="font-semibold text-[var(--ink)]">{doctorLabel(d)}</p>
                {d.room ? (
                  <p className="mt-1 text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                    {t.healthcareRoom}: {d.room}
                  </p>
                ) : null}
                <p className="mt-1 text-sm text-[color-mix(in_oklab,var(--ink)_65%,white)]">
                  {formatSchedule(d.schedules, weekdayLabel)}
                </p>
                {d.phone ? (
                  <a
                    href={`tel:${d.phone}`}
                    className="mt-2 inline-block text-sm font-semibold text-[var(--blood-deep)]"
                  >
                    {d.phone}
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {doctors.length > 0 ? (
        <section className="rounded-2xl border border-[color-mix(in_oklab,var(--blood)_20%,white)] bg-[linear-gradient(165deg,#fffdfa_0%,#ffffff_50%,#fff0ee_100%)] p-5 shadow-[0_12px_36px_rgba(110,18,32,0.08)] md:p-6">
          <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--blood-deep)]">
            {t.healthcareBookTitle}
          </h3>
          <p className="mt-1 text-sm text-[color-mix(in_oklab,var(--ink)_60%,white)]">
            {t.healthcareBookHint}
          </p>

          {booked ? (
            <p className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {t.healthcareBookSuccess}
            </p>
          ) : null}

          <form className="mt-4 space-y-4" onSubmit={(e) => void submitBooking(e)}>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t.healthcareSelectDoctor}</span>
              <select
                className="field"
                required
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
              >
                <option value="">{t.healthcareSelectDoctor}</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {doctorLabel(d)}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">{t.healthcarePatientName}</span>
                <input
                  className="field"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">{t.healthcarePatientPhone}</span>
                <input
                  className="field"
                  type="tel"
                  required
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t.healthcarePreferredTime}</span>
              <input
                className="field"
                type="datetime-local"
                required
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t.healthcareNotes}</span>
              <textarea
                className="field min-h-[88px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.healthcareNotesPlaceholder}
              />
            </label>
            {bookError ? <p className="text-sm text-[var(--blood)]">{bookError}</p> : null}
            <button type="submit" className="btn-glass-primary" disabled={booking}>
              {booking ? t.loading : t.healthcareBookSubmit}
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}

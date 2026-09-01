"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { HealthcareAppointmentBooking } from "@/components/healthcare/HealthcareAppointmentBooking";
import { useLocale } from "@/lib/i18n/locale-context";
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

type CompanyResponse = {
  company: {
    id: string;
    name: string;
    nameBn: string;
    contactPhone: string;
    contactEmail: string;
    district: string;
    upazila: string;
    linkedDghsIds: string[];
  };
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
  patientsLabel: string,
) {
  if (!schedules.length) return "—";
  return schedules
    .map(
      (s) =>
        `${weekdayLabel(s.weekday)} ${s.startTime}–${s.endTime} (${s.maxPatients || 20} ${patientsLabel})`,
    )
    .join(" · ");
}

export function HealthcareCompanyPublicView({ companyId }: { companyId: string }) {
  const { t, locale } = useLocale();
  const [data, setData] = useState<CompanyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      const res = await fetch(`/api/healthcare/company/${companyId}`);
      const json = (await res.json()) as CompanyResponse;
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
  }, [companyId, t.healthcareLoadError]);

  useEffect(() => {
    void load();
  }, [load]);

  const company = data?.company;
  const doctors = data?.doctors ?? [];

  const companyName = useMemo(() => {
    if (!company) return "";
    return locale === "bn" && company.nameBn ? company.nameBn : company.name;
  }, [company, locale]);

  const doctorLabel = (d: DoctorSummary) => {
    const name = locale === "bn" && d.nameBn ? d.nameBn : d.name;
    const specialty = locale === "bn" && d.specialtyBn ? d.specialtyBn : d.specialty;
    return specialty ? `${name} — ${specialty}` : name;
  };

  if (loading) {
    return <p className="text-sm text-[color-mix(in_oklab,var(--ink)_55%,white)]">{t.loading}</p>;
  }

  if (error || !company) {
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
            {t.healthcareRegisteredProvider}
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)] md:text-3xl">
            {companyName}
          </h2>
          <p className="mt-2 text-sm text-[color-mix(in_oklab,var(--ink)_65%,white)]">
            {[company.upazila, company.district].filter(Boolean).join(", ")}
          </p>
        </div>
        <div className="p-5 md:p-6">
          {company.contactPhone ? (
            <a
              href={`tel:${company.contactPhone}`}
              className="inline-flex font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--blood-deep)]"
            >
              {company.contactPhone}
            </a>
          ) : null}
          {company.contactEmail ? (
            <a className="mt-2 block break-all text-sm underline" href={`mailto:${company.contactEmail}`}>
              {company.contactEmail}
            </a>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-white/85 p-5 md:p-6">
        <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--blood-deep)]">
          {t.healthcareDoctors}
        </h3>
        {doctors.length === 0 ? (
          <p className="mt-4 text-sm text-[color-mix(in_oklab,var(--ink)_60%,white)]">
            {t.healthcareNoDoctors}
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {doctors.map((d) => (
              <li
                key={d.id}
                className="rounded-xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--sand)_15%,white)] px-4 py-3"
              >
                <p className="font-semibold">{doctorLabel(d)}</p>
                {d.room ? (
                  <p className="mt-1 text-xs">{t.healthcareRoom}: {d.room}</p>
                ) : null}
                <p className="mt-1 text-sm">
                  {formatSchedule(d.schedules, weekdayLabel, t.healthcarePatientsPerDay)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {doctors.length > 0 ? (
        <HealthcareAppointmentBooking
          doctors={doctors}
          dghsId={company.linkedDghsIds[0] || ""}
          facilityName={companyName}
          defaultDoctorId={doctors.length === 1 ? doctors[0].id : undefined}
        />
      ) : null}
    </div>
  );
}

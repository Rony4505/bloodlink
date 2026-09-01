"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HealthcareVerbalUrlCard } from "@/components/healthcare/HealthcareVerbalUrlCard";
import { HealthcareAppointmentBooking } from "@/components/healthcare/HealthcareAppointmentBooking";
import { useLocale } from "@/lib/i18n/locale-context";
import type {
  HealthcareAppointment,
  HealthcareDoctor,
  HealthcareDoctorSchedule,
} from "@/lib/healthcare-platform";

type FacilityRef = {
  dghsId: string;
  name: string;
  nameBn: string;
  district: string;
  upazila: string;
};

type DashboardData = {
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
  facilities: FacilityRef[];
  doctors: HealthcareDoctor[];
  appointments: HealthcareAppointment[];
  stats: {
    doctors: number;
    appointments: number;
    pending: number;
    confirmed: number;
  };
};

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;
const BD_WEEKEND = new Set([5, 6]);
const WEEKDAY_KEYS = [
  "healthcareWeekSun",
  "healthcareWeekMon",
  "healthcareWeekTue",
  "healthcareWeekWed",
  "healthcareWeekThu",
  "healthcareWeekFri",
  "healthcareWeekSat",
] as const;

type DayScheduleDraft = {
  weekday: number;
  selected: boolean;
  startTime: string;
  endTime: string;
  maxPatients: number;
};

type DoctorDraft = {
  name: string;
  nameBn: string;
  specialty: string;
  specialtyBn: string;
  phone: string;
  room: string;
  daySchedules: DayScheduleDraft[];
};

function defaultDaySchedules(): DayScheduleDraft[] {
  return WEEKDAYS.map((weekday) => ({
    weekday,
    selected: false,
    startTime: "09:00",
    endTime: "17:00",
    maxPatients: 20,
  }));
}

function emptyDoctorDraft(): DoctorDraft {
  return {
    name: "",
    nameBn: "",
    specialty: "",
    specialtyBn: "",
    phone: "",
    room: "",
    daySchedules: defaultDaySchedules(),
  };
}

function schedulesToDayDrafts(schedules: HealthcareDoctorSchedule[]): DayScheduleDraft[] {
  const map = new Map(schedules.map((s) => [s.weekday, s]));
  return WEEKDAYS.map((weekday) => {
    const row = map.get(weekday);
    return {
      weekday,
      selected: Boolean(row),
      startTime: row?.startTime ?? "09:00",
      endTime: row?.endTime ?? "17:00",
      maxPatients: row?.maxPatients ?? 20,
    };
  });
}

function dayDraftsToSchedules(days: DayScheduleDraft[]): HealthcareDoctorSchedule[] {
  return days
    .filter((d) => d.selected)
    .map((d) => ({
      id: `sch_${d.weekday}`,
      weekday: d.weekday,
      startTime: d.startTime,
      endTime: d.endTime,
      slotMinutes: 15,
      maxPatients: Math.max(1, d.maxPatients || 20),
      notes: "",
    }));
}

function scheduleSummaryLabel(
  days: DayScheduleDraft[],
  t: {
    healthcareScheduleSummary: string;
    healthcareScheduleSummaryFive: string;
    healthcareScheduleSummarySeven: string;
  },
): string {
  const selected = days.filter((d) => d.selected);
  const count = selected.length;
  if (count === 0) return "";
  const weekendOff = !selected.some((d) => BD_WEEKEND.has(d.weekday));
  if (count === 7) return t.healthcareScheduleSummarySeven;
  if (count === 5 && weekendOff) return t.healthcareScheduleSummaryFive;
  return t.healthcareScheduleSummary.replace("{count}", String(count));
}


type Tab = "appointments" | "doctors" | "portal";

export function HealthcareCompanyDashboard({ token }: { token: string }) {
  const { t, locale } = useLocale();
  const [data, setData] = useState<DashboardData | null>(null);
  const [tab, setTab] = useState<Tab>("appointments");
  const [statusFilter, setStatusFilter] = useState<"all" | HealthcareAppointment["status"]>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [doctorDraft, setDoctorDraft] = useState<DoctorDraft>(emptyDoctorDraft);
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);

  const apiBase = `/api/public/healthcare/${encodeURIComponent(token)}`;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(apiBase);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || t.errorGeneric);
        setData(null);
        return;
      }
      const payload = json as DashboardData;
      setData(payload);
    } catch {
      setError(t.errorGeneric);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [apiBase, t.errorGeneric]);

  useEffect(() => {
    void load();
  }, [load]);

  const companyName = useMemo(() => {
    if (!data) return "";
    return locale === "bn" && data.company.nameBn ? data.company.nameBn : data.company.name;
  }, [data, locale]);

  const scheduleSummary = useMemo(
    () => scheduleSummaryLabel(doctorDraft.daySchedules, t),
    [doctorDraft.daySchedules, t],
  );

  const companyDghsId = useMemo(() => {
    if (!data) return "";
    return data.company.linkedDghsIds[0] || data.facilities[0]?.dghsId || "";
  }, [data]);

  const filteredAppointments = useMemo(() => {
    if (!data) return [];
    if (statusFilter === "all") return data.appointments;
    return data.appointments.filter((a) => a.status === statusFilter);
  }, [data, statusFilter]);

  const doctorName = (d: HealthcareDoctor) =>
    locale === "bn" && d.nameBn ? d.nameBn : d.name;

  function weekdayLabel(weekday: number) {
    const key = WEEKDAY_KEYS[weekday] ?? WEEKDAY_KEYS[0];
    return t[key];
  }

  function formatSchedule(schedules: HealthcareDoctorSchedule[]) {
    if (!schedules.length) return "—";
    return schedules
      .map(
        (s) =>
          `${weekdayLabel(s.weekday)} ${s.startTime}–${s.endTime} (${s.maxPatients || 20} ${t.healthcarePatientsPerDay})`,
      )
      .join(" · ");
  }

  async function patchAppointment(input: {
    appointmentId: string;
    status?: HealthcareAppointment["status"];
    date?: string;
    notifyPatient?: boolean;
  }) {
    const res = await fetch(`${apiBase}/appointments`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const json = await res.json();
      setError(json.error || t.errorGeneric);
      return false;
    }
    setMessage(t.healthcareAppointmentUpdated);
    void load();
    return true;
  }

  async function cancelAppointment(appointmentId: string) {
    if (!window.confirm(t.healthcareConfirmCancel)) return;
    const notifyPatient = window.confirm(t.healthcareNotifyPatient);
    if (!notifyPatient) {
      setError(t.healthcareNotifyPatient);
      return;
    }
    await patchAppointment({ appointmentId, status: "cancelled", notifyPatient: true });
  }

  async function rescheduleAppointment(appointmentId: string, date: string) {
    if (!date) return;
    const notifyPatient = window.confirm(t.healthcareNotifyPatient);
    if (!notifyPatient) {
      setError(t.healthcareNotifyPatient);
      return;
    }
    await patchAppointment({ appointmentId, date, notifyPatient: true });
  }

  async function updateAppointmentStatus(
    appointmentId: string,
    status: HealthcareAppointment["status"],
  ) {
    if (status === "cancelled") {
      await cancelAppointment(appointmentId);
      return;
    }
    await patchAppointment({ appointmentId, status });
  }

  async function submitDoctor(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    const schedules = dayDraftsToSchedules(doctorDraft.daySchedules);
    if (!schedules.length) {
      setError(t.healthcareSchedulePickDays);
      return;
    }

    const res = await fetch(`${apiBase}/doctors`, {
      method: editingDoctorId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorId: editingDoctorId,
        dghsId: companyDghsId || undefined,
        name: doctorDraft.name,
        nameBn: doctorDraft.nameBn,
        specialty: doctorDraft.specialty,
        specialtyBn: doctorDraft.specialtyBn,
        phone: doctorDraft.phone,
        room: doctorDraft.room,
        schedules,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || t.errorGeneric);
      return;
    }
    setMessage(editingDoctorId ? t.healthcareDoctorUpdated : t.healthcareDoctorAdded);
    setDoctorDraft(emptyDoctorDraft());
    setEditingDoctorId(null);
    void load();
  }

  async function deleteDoctor(doctorId: string) {
    if (!window.confirm(t.healthcareDoctorDeleteConfirm)) return;
    const res = await fetch(`${apiBase}/doctors?doctorId=${encodeURIComponent(doctorId)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const json = await res.json();
      setError(json.error || t.errorGeneric);
      return;
    }
    setMessage(t.healthcareDoctorDeleted);
    void load();
  }

  function startEditDoctor(doctor: HealthcareDoctor) {
    setEditingDoctorId(doctor.id);
    setDoctorDraft({
      name: doctor.name,
      nameBn: doctor.nameBn,
      specialty: doctor.specialty,
      specialtyBn: doctor.specialtyBn,
      phone: doctor.phone,
      room: doctor.room,
      daySchedules: schedulesToDayDrafts(doctor.schedules),
    });
    setTab("doctors");
  }

  function toggleDoctorDay(weekday: number) {
    setDoctorDraft((draft) => ({
      ...draft,
      daySchedules: draft.daySchedules.map((d) => {
        if (d.weekday !== weekday) return d;
        const selected = !d.selected;
        if (selected && weekday === 5) {
          return { ...d, selected: true, startTime: "09:00", endTime: "12:00" };
        }
        return { ...d, selected };
      }),
    }));
  }

  function updateDoctorDayTime(
    weekday: number,
    field: "startTime" | "endTime",
    value: string,
  ) {
    setDoctorDraft((draft) => ({
      ...draft,
      daySchedules: draft.daySchedules.map((d) =>
        d.weekday === weekday ? { ...d, [field]: value } : d,
      ),
    }));
  }

  function exportCsv() {
    if (!data?.appointments.length) return;
    const rows = [
      ["serial", "patient", "phone", "status", "scheduledAt", "source", "notes"].join(","),
      ...data.appointments.map((a) =>
        [
          a.serialNumber || "",
          a.patientName,
          a.patientPhone,
          a.status,
          a.scheduledAt,
          a.source,
          a.notes.replace(/,/g, " "),
        ].join(","),
      ),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `appointments-${data.company.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading && !data) {
    return <p className="text-sm text-[color-mix(in_oklab,var(--ink)_55%,white)]">{t.loading}</p>;
  }

  if (error && !data) {
    return (
      <p className="rounded-xl border border-[var(--line)] bg-white/85 px-4 py-6 text-center text-sm text-[var(--blood)]">
        {error}
      </p>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/60 bg-white/90 p-5 shadow-[0_18px_50px_rgba(110,18,32,0.08)] md:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--blood)]">
          {t.healthcareCompanyPortal}
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]">
          {companyName}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-[var(--cream)] px-3 py-1">
            {t.healthcarePending}: <strong>{data.stats.pending}</strong>
          </span>
          <span className="rounded-full bg-[var(--cream)] px-3 py-1">
            {t.healthcareConfirmed}: <strong>{data.stats.confirmed}</strong>
          </span>
          <span className="rounded-full bg-[var(--cream)] px-3 py-1">
            {t.healthcareDoctors}: <strong>{data.stats.doctors}</strong>
          </span>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {(["appointments", "doctors", "portal"] as Tab[]).map((key) => (
          <button
            key={key}
            type="button"
            className={tab === key ? "btn-primary" : "btn-ghost"}
            onClick={() => setTab(key)}
          >
            {key === "appointments"
              ? t.healthcareAppointments
              : key === "doctors"
                ? t.healthcareDoctors
                : t.healthcarePortalLink}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-[var(--blood)]">{error}</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}

      {tab === "portal" ? <HealthcareVerbalUrlCard token={token} /> : null}

      {tab === "appointments" ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <select
              className="field max-w-xs"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            >
              <option value="all">{t.adminHealthcareAll}</option>
              <option value="pending">{t.healthcarePending}</option>
              <option value="confirmed">{t.healthcareConfirmed}</option>
              <option value="completed">{t.healthcareCompleted}</option>
              <option value="cancelled">{t.healthcareCancelled}</option>
            </select>
            <button type="button" className="btn-ghost" onClick={exportCsv}>
              {t.healthcareExportCsv}
            </button>
          </div>

          {filteredAppointments.length === 0 ? (
            <p className="text-sm text-[color-mix(in_oklab,var(--ink)_55%,white)]">
              {t.healthcareNoAppointments}
            </p>
          ) : (
            <ul className="space-y-3">
              {filteredAppointments.map((a) => {
                const doctor = data.doctors.find((d) => d.id === a.doctorId);
                const rescheduleId = `reschedule-${a.id}`;
                return (
                  <li
                    key={a.id}
                    className="rounded-xl border border-[var(--line)] bg-white/85 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {a.serialNumber ? (
                            <span className="mr-2 font-[family-name:var(--font-display)] text-lg text-[var(--blood-deep)]">
                              #{a.serialNumber}
                            </span>
                          ) : null}
                          {a.patientName}
                        </p>
                        <a
                          href={`tel:${a.patientPhone}`}
                          className="text-sm font-medium text-[var(--blood-deep)]"
                        >
                          {a.patientPhone}
                        </a>
                        <p className="mt-1 text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                          {new Date(a.scheduledAt).toLocaleString(locale === "bn" ? "bn-BD" : "en")}
                          {doctor ? ` · ${doctorName(doctor)}` : ""}
                        </p>
                        {a.notes ? (
                          <p className="mt-1 text-xs text-[color-mix(in_oklab,var(--ink)_60%,white)]">
                            {a.notes}
                          </p>
                        ) : null}
                        {a.status !== "cancelled" ? (
                          <div className="mt-3 flex flex-wrap items-end gap-2">
                            <label className="block text-xs">
                              <span className="mb-1 block">{t.healthcareNewDate}</span>
                              <input
                                id={rescheduleId}
                                className="field py-1 text-sm"
                                type="date"
                                defaultValue={(a.slotStart || a.scheduledAt).slice(0, 10)}
                              />
                            </label>
                            <button
                              type="button"
                              className="btn-ghost px-3 py-1 text-xs"
                              onClick={() => {
                                const input = document.getElementById(
                                  rescheduleId,
                                ) as HTMLInputElement | null;
                                void rescheduleAppointment(a.id, input?.value || "");
                              }}
                            >
                              {t.healthcareRescheduleAppointment}
                            </button>
                            <button
                              type="button"
                              className="btn-ghost px-3 py-1 text-xs text-[var(--blood)]"
                              onClick={() => void cancelAppointment(a.id)}
                            >
                              {t.healthcareCancelAppointment}
                            </button>
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(["pending", "confirmed", "completed", "cancelled"] as const).map(
                          (status) => (
                            <button
                              key={status}
                              type="button"
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                                a.status === status
                                  ? "bg-[var(--blood-deep)] text-white"
                                  : "bg-[var(--cream)]"
                              }`}
                              onClick={() => void updateAppointmentStatus(a.id, status)}
                            >
                              {status === "pending"
                                ? t.healthcarePending
                                : status === "confirmed"
                                  ? t.healthcareConfirmed
                                  : status === "completed"
                                    ? t.healthcareCompleted
                                    : t.healthcareCancelled}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {data.doctors.length > 0 ? (
            <HealthcareAppointmentBooking
              doctors={data.doctors.map((d) => ({
                id: d.id,
                name: d.name,
                nameBn: d.nameBn,
                specialty: d.specialty,
                specialtyBn: d.specialtyBn,
              }))}
              dghsId={companyDghsId}
              facilityName={companyName}
              title={t.healthcareManualAppointment}
              submitUrl={`${apiBase}/appointments`}
              submitLabel={t.healthcareSaveManualAppointment}
              showSlip={false}
              onBooked={() => {
                setMessage(t.healthcareAppointmentCreated);
                void load();
              }}
            />
          ) : null}
        </div>
      ) : null}

      {tab === "doctors" ? (
        <div className="space-y-5">
          <ul className="space-y-3">
            {data.doctors.map((d) => (
              <li
                key={d.id}
                className="rounded-xl border border-[var(--line)] bg-white/85 px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{doctorName(d)}</p>
                    <p className="text-sm text-[color-mix(in_oklab,var(--ink)_60%,white)]">
                      {locale === "bn" && d.specialtyBn ? d.specialtyBn : d.specialty}
                    </p>
                    <p className="mt-1 text-xs">{formatSchedule(d.schedules)}</p>
                    {d.phone ? (
                      <a href={`tel:${d.phone}`} className="mt-1 inline-block text-sm text-[var(--blood-deep)]">
                        {d.phone}
                      </a>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="btn-ghost px-3 py-1 text-xs" onClick={() => startEditDoctor(d)}>
                      {t.edit}
                    </button>
                    <button
                      type="button"
                      className="btn-ghost px-3 py-1 text-xs text-[var(--blood)]"
                      onClick={() => void deleteDoctor(d.id)}
                    >
                      {t.delete}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <form
            className="rounded-2xl border border-[color-mix(in_oklab,var(--blood)_18%,white)] bg-white/90 p-4"
            onSubmit={(e) => void submitDoctor(e)}
          >
            <h3 className="font-semibold text-[var(--blood-deep)]">
              {editingDoctorId ? t.healthcareEditDoctor : t.healthcareAddDoctor}
            </h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <input
                className="field"
                required
                placeholder={t.healthcareDoctorName}
                value={doctorDraft.name}
                onChange={(e) => setDoctorDraft((d) => ({ ...d, name: e.target.value }))}
              />
              <input
                className="field"
                placeholder={t.healthcareDoctorNameBn}
                value={doctorDraft.nameBn}
                onChange={(e) => setDoctorDraft((d) => ({ ...d, nameBn: e.target.value }))}
              />
              <input
                className="field"
                placeholder={t.healthcareSpecialty}
                value={doctorDraft.specialty}
                onChange={(e) => setDoctorDraft((d) => ({ ...d, specialty: e.target.value }))}
              />
              <input
                className="field"
                placeholder={t.healthcareSpecialtyBn}
                value={doctorDraft.specialtyBn}
                onChange={(e) => setDoctorDraft((d) => ({ ...d, specialtyBn: e.target.value }))}
              />
              <input
                className="field"
                placeholder={t.healthcareRoom}
                value={doctorDraft.room}
                onChange={(e) => setDoctorDraft((d) => ({ ...d, room: e.target.value }))}
              />
              <input
                className="field"
                type="tel"
                placeholder={t.healthcareCompanyPhone}
                value={doctorDraft.phone}
                onChange={(e) => setDoctorDraft((d) => ({ ...d, phone: e.target.value }))}
              />
            </div>

            <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--cream)]/50 p-4">
              <p className="text-sm font-medium text-[var(--ink)]">{t.healthcareSchedulePickDays}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {doctorDraft.daySchedules.map((day) => (
                  <button
                    key={day.weekday}
                    type="button"
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                      day.selected
                        ? "bg-[var(--blood-deep)] text-white"
                        : "border border-[var(--line)] bg-white text-[var(--ink)]"
                    }`}
                    onClick={() => toggleDoctorDay(day.weekday)}
                  >
                    {weekdayLabel(day.weekday)}
                  </button>
                ))}
              </div>
              {scheduleSummary ? (
                <p className="mt-3 text-sm font-semibold text-[var(--blood-deep)]">{scheduleSummary}</p>
              ) : null}

              {doctorDraft.daySchedules.some((d) => d.selected) ? (
                <ul className="mt-4 space-y-3">
                  {doctorDraft.daySchedules
                    .filter((d) => d.selected)
                    .map((day) => (
                      <li
                        key={day.weekday}
                        className="grid gap-2 rounded-lg border border-[var(--line)] bg-white p-3 sm:grid-cols-[72px_1fr_1fr_88px]"
                      >
                        <span className="self-center text-sm font-semibold">
                          {weekdayLabel(day.weekday)}
                        </span>
                        <label className="block text-xs">
                          <span className="mb-1 block text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                            {t.healthcareScheduleStart}
                          </span>
                          <input
                            className="field"
                            type="time"
                            value={day.startTime}
                            onChange={(e) =>
                              updateDoctorDayTime(day.weekday, "startTime", e.target.value)
                            }
                          />
                        </label>
                        <label className="block text-xs">
                          <span className="mb-1 block text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                            {t.healthcareScheduleEnd}
                          </span>
                          <input
                            className="field"
                            type="time"
                            value={day.endTime}
                            onChange={(e) =>
                              updateDoctorDayTime(day.weekday, "endTime", e.target.value)
                            }
                          />
                        </label>
                        <label className="block text-xs">
                          <span className="mb-1 block text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                            {t.healthcareMaxPatients}
                          </span>
                          <input
                            className="field"
                            type="number"
                            min={1}
                            max={500}
                            value={day.maxPatients}
                            onChange={(e) =>
                              setDoctorDraft((draft) => ({
                                ...draft,
                                daySchedules: draft.daySchedules.map((d) =>
                                  d.weekday === day.weekday
                                    ? { ...d, maxPatients: Number(e.target.value) || 1 }
                                    : d,
                                ),
                              }))
                            }
                          />
                        </label>
                      </li>
                    ))}
                </ul>
              ) : null}
            </div>
            <div className="mt-3 flex gap-2">
              <button type="submit" className="btn-glass-primary">
                {editingDoctorId ? t.save : t.healthcareAddDoctor}
              </button>
              {editingDoctorId ? (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    setEditingDoctorId(null);
                    setDoctorDraft(emptyDoctorDraft());
                  }}
                >
                  {t.cancel}
                </button>
              ) : null}
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HealthcareVerbalUrlCard } from "@/components/healthcare/HealthcareVerbalUrlCard";
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
const WEEKDAY_KEYS = [
  "healthcareWeekSun",
  "healthcareWeekMon",
  "healthcareWeekTue",
  "healthcareWeekWed",
  "healthcareWeekThu",
  "healthcareWeekFri",
  "healthcareWeekSat",
] as const;

const emptyDoctor = {
  dghsId: "",
  name: "",
  nameBn: "",
  specialty: "",
  specialtyBn: "",
  phone: "",
  room: "",
  weekday: 0,
  startTime: "09:00",
  endTime: "13:00",
};

const emptyManualAppt = {
  doctorId: "",
  dghsId: "",
  patientName: "",
  patientPhone: "",
  scheduledAt: "",
  notes: "",
};

type Tab = "appointments" | "doctors" | "portal";

export function HealthcareCompanyDashboard({ token }: { token: string }) {
  const { t, locale } = useLocale();
  const [data, setData] = useState<DashboardData | null>(null);
  const [tab, setTab] = useState<Tab>("appointments");
  const [statusFilter, setStatusFilter] = useState<"all" | HealthcareAppointment["status"]>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [doctorDraft, setDoctorDraft] = useState(emptyDoctor);
  const [manualAppt, setManualAppt] = useState(emptyManualAppt);
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
      if (payload.facilities?.[0]) {
        setDoctorDraft((d) => (d.dghsId ? d : { ...d, dghsId: payload.facilities[0]!.dghsId }));
        setManualAppt((a) => (a.dghsId ? a : { ...a, dghsId: payload.facilities[0]!.dghsId }));
      }
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
      .map((s) => `${weekdayLabel(s.weekday)} ${s.startTime}–${s.endTime}`)
      .join(" · ");
  }

  async function updateAppointmentStatus(
    appointmentId: string,
    status: HealthcareAppointment["status"],
  ) {
    const res = await fetch(`${apiBase}/appointments`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId, status }),
    });
    if (!res.ok) {
      const json = await res.json();
      setError(json.error || t.errorGeneric);
      return;
    }
    setMessage(t.healthcareAppointmentUpdated);
    void load();
  }

  async function submitDoctor(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    const schedules: HealthcareDoctorSchedule[] = [
      {
        id: `sch_${doctorDraft.weekday}`,
        weekday: doctorDraft.weekday,
        startTime: doctorDraft.startTime,
        endTime: doctorDraft.endTime,
        slotMinutes: 15,
        notes: "",
      },
    ];

    const res = await fetch(`${apiBase}/doctors`, {
      method: editingDoctorId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorId: editingDoctorId,
        dghsId: doctorDraft.dghsId,
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
    setDoctorDraft((d) => ({ ...emptyDoctor, dghsId: d.dghsId }));
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
    const first = doctor.schedules[0];
    setEditingDoctorId(doctor.id);
    setDoctorDraft({
      dghsId: doctor.dghsId,
      name: doctor.name,
      nameBn: doctor.nameBn,
      specialty: doctor.specialty,
      specialtyBn: doctor.specialtyBn,
      phone: doctor.phone,
      room: doctor.room,
      weekday: first?.weekday ?? 0,
      startTime: first?.startTime ?? "09:00",
      endTime: first?.endTime ?? "13:00",
    });
    setTab("doctors");
  }

  async function submitManualAppointment(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    const res = await fetch(`${apiBase}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(manualAppt),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || t.errorGeneric);
      return;
    }
    setMessage(t.healthcareAppointmentCreated);
    setManualAppt((a) => ({ ...emptyManualAppt, dghsId: a.dghsId, doctorId: a.doctorId }));
    void load();
  }

  function exportCsv() {
    if (!data?.appointments.length) return;
    const rows = [
      ["patient", "phone", "status", "scheduledAt", "source", "notes"].join(","),
      ...data.appointments.map((a) =>
        [
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
                return (
                  <li
                    key={a.id}
                    className="rounded-xl border border-[var(--line)] bg-white/85 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{a.patientName}</p>
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

          <form
            className="rounded-2xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--sand)_12%,white)] p-4"
            onSubmit={(e) => void submitManualAppointment(e)}
          >
            <h3 className="font-semibold text-[var(--blood-deep)]">{t.healthcareManualAppointment}</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <select
                className="field"
                required
                value={manualAppt.doctorId}
                onChange={(e) => {
                  const doctor = data.doctors.find((d) => d.id === e.target.value);
                  setManualAppt((a) => ({
                    ...a,
                    doctorId: e.target.value,
                    dghsId: doctor?.dghsId || a.dghsId,
                  }));
                }}
              >
                <option value="">{t.healthcareSelectDoctor}</option>
                {data.doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {doctorName(d)}
                  </option>
                ))}
              </select>
              <input
                className="field"
                required
                placeholder={t.healthcarePatientName}
                value={manualAppt.patientName}
                onChange={(e) => setManualAppt((a) => ({ ...a, patientName: e.target.value }))}
              />
              <input
                className="field"
                required
                type="tel"
                placeholder={t.healthcarePatientPhone}
                value={manualAppt.patientPhone}
                onChange={(e) => setManualAppt((a) => ({ ...a, patientPhone: e.target.value }))}
              />
              <input
                className="field"
                required
                type="datetime-local"
                value={manualAppt.scheduledAt}
                onChange={(e) => setManualAppt((a) => ({ ...a, scheduledAt: e.target.value }))}
              />
            </div>
            <button type="submit" className="btn-glass-primary mt-3">
              {t.healthcareAddPhoneAppointment}
            </button>
          </form>
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
              <select
                className="field md:col-span-2"
                required
                value={doctorDraft.dghsId}
                onChange={(e) => setDoctorDraft((d) => ({ ...d, dghsId: e.target.value }))}
              >
                <option value="">{t.healthcareSelectFacility}</option>
                {data.facilities.map((f) => (
                  <option key={f.dghsId} value={f.dghsId}>
                    {locale === "bn" && f.nameBn ? f.nameBn : f.name}
                  </option>
                ))}
              </select>
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
              <select
                className="field"
                value={doctorDraft.weekday}
                onChange={(e) =>
                  setDoctorDraft((d) => ({ ...d, weekday: Number(e.target.value) }))
                }
              >
                {WEEKDAYS.map((day) => (
                  <option key={day} value={day}>
                    {weekdayLabel(day)}
                  </option>
                ))}
              </select>
              <input
                className="field"
                type="time"
                value={doctorDraft.startTime}
                onChange={(e) => setDoctorDraft((d) => ({ ...d, startTime: e.target.value }))}
              />
              <input
                className="field"
                type="time"
                value={doctorDraft.endTime}
                onChange={(e) => setDoctorDraft((d) => ({ ...d, endTime: e.target.value }))}
              />
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
                    setDoctorDraft((d) => ({ ...emptyDoctor, dghsId: d.dghsId }));
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

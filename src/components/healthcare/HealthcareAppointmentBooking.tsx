"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HealthcareAppointmentSlip } from "@/components/healthcare/HealthcareAppointmentSlip";
import { useLocale } from "@/lib/i18n/locale-context";

type DoctorOption = {
  id: string;
  name: string;
  nameBn: string;
  specialty: string;
  specialtyBn: string;
};

type DayCapacity = {
  date: string;
  available: boolean;
  maxPatients: number;
  booked: number;
  remaining: number;
  hasSchedule?: boolean;
};

type BookedAppointment = {
  id: string;
  serialNumber: string;
  patientName: string;
  patientPhone: string;
  slotStart: string;
  slotEnd: string;
  scheduledAt: string;
  status: string;
};

type Props = {
  doctors: DoctorOption[];
  dghsId?: string;
  facilityName: string;
  defaultDoctorId?: string;
  title?: string;
  submitUrl?: string;
  submitLabel?: string;
  showSlip?: boolean;
  onBooked?: () => void;
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

export function HealthcareAppointmentBooking({
  doctors,
  dghsId,
  facilityName,
  defaultDoctorId,
  title,
  submitUrl = "/api/healthcare/appointments",
  submitLabel,
  showSlip = true,
  onBooked,
}: Props) {
  const { t, locale } = useLocale();
  const now = new Date();
  const [doctorId, setDoctorId] = useState(defaultDoctorId || doctors[0]?.id || "");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [days, setDays] = useState<DayCapacity[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [nextSerial, setNextSerial] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loadingDays, setLoadingDays] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState("");
  const [bookSuccess, setBookSuccess] = useState("");
  const [booked, setBooked] = useState<BookedAppointment | null>(null);
  const [bookedDoctor, setBookedDoctor] = useState<DoctorOption | null>(null);
  const [smsSent, setSmsSent] = useState<boolean | null>(null);

  const doctorLabel = useCallback(
    (d: DoctorOption) => {
      const name = locale === "bn" && d.nameBn ? d.nameBn : d.name;
      const specialty = locale === "bn" && d.specialtyBn ? d.specialtyBn : d.specialty;
      return specialty ? `${name} — ${specialty}` : name;
    },
    [locale],
  );

  const selectedDoctor = useMemo(
    () => doctors.find((d) => d.id === doctorId) ?? null,
    [doctors, doctorId],
  );

  const loadDays = useCallback(async () => {
    if (!doctorId) return;
    setLoadingDays(true);
    try {
      const res = await fetch(
        `/api/healthcare/appointments/availability?doctorId=${encodeURIComponent(doctorId)}&year=${year}&month=${month}`,
      );
      const json = (await res.json()) as { days?: DayCapacity[] };
      setDays(json.days || []);
    } catch {
      setDays([]);
    } finally {
      setLoadingDays(false);
    }
  }, [doctorId, year, month]);

  useEffect(() => {
    void loadDays();
  }, [loadDays]);

  useEffect(() => {
    setSelectedDate("");
    setNextSerial("");
    setBooked(null);
    setBookSuccess("");
  }, [doctorId, year, month]);

  useEffect(() => {
    if (!selectedDate || !doctorId) {
      setNextSerial("");
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/healthcare/appointments/slots?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(selectedDate)}`,
        );
        const json = (await res.json()) as { booking?: { nextSerial?: string } | null };
        if (!cancelled) {
          setNextSerial(json.booking?.nextSerial || "");
        }
      } catch {
        if (!cancelled) setNextSerial("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedDate, doctorId]);

  function shiftMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  }

  const monthLabel = useMemo(() => {
    try {
      return new Date(year, month - 1, 1).toLocaleString(locale === "bn" ? "bn-BD" : "en", {
        month: "long",
        year: "numeric",
      });
    } catch {
      return `${month}/${year}`;
    }
  }, [year, month, locale]);

  const calendarCells = useMemo(() => {
    const firstDow = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const cells: Array<{ day: number | null; dateStr: string; info?: DayCapacity }> = [];
    for (let i = 0; i < firstDow; i++) cells.push({ day: null, dateStr: "" });
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ day: d, dateStr, info: days.find((x) => x.date === dateStr) });
    }
    return cells;
  }, [year, month, days]);

  function resetForm() {
    setBooked(null);
    setBookedDoctor(null);
    setPatientName("");
    setPatientPhone("");
    setNotes("");
    setSelectedDate("");
    setNextSerial("");
    setBookSuccess("");
  }

  async function submitBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDate || !doctorId) return;
    setBooking(true);
    setBookError("");
    setBookSuccess("");
    try {
      const res = await fetch(submitUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId,
          dghsId: dghsId || "",
          date: selectedDate,
          patientName,
          patientPhone,
          notes,
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        appointment?: BookedAppointment;
        sms?: { delivered?: boolean };
      };
      if (!res.ok) {
        setBookError(json.error || t.healthcareBookError);
        return;
      }
      onBooked?.();
      if (showSlip && json.appointment) {
        setBooked(json.appointment);
        setBookedDoctor(selectedDoctor);
        setSmsSent(json.sms?.delivered ?? null);
        setSelectedDate("");
        void loadDays();
        return;
      }
      setBookSuccess(t.healthcareAppointmentCreated);
      setPatientName("");
      setPatientPhone("");
      setNotes("");
      setSelectedDate("");
      setNextSerial("");
      void loadDays();
    } catch {
      setBookError(t.healthcareBookError);
    } finally {
      setBooking(false);
    }
  }

  if (!doctors.length) {
    return (
      <p className="rounded-xl bg-[var(--cream)] px-4 py-3 text-sm">{t.healthcareNoDoctors}</p>
    );
  }

  if (booked && bookedDoctor && showSlip) {
    return (
      <HealthcareAppointmentSlip
        appointment={booked}
        doctor={bookedDoctor}
        facilityName={facilityName}
        smsSent={smsSent}
        onBookAnother={resetForm}
      />
    );
  }

  const selectedInfo = days.find((d) => d.date === selectedDate);
  const heading = title || t.healthcareBookTitle;
  const buttonLabel = submitLabel || t.healthcareBookSubmit;

  return (
    <section className="rounded-2xl border border-[color-mix(in_oklab,var(--blood)_20%,white)] bg-[linear-gradient(165deg,#fffdfa_0%,#ffffff_50%,#fff0ee_100%)] p-5 shadow-[0_12px_36px_rgba(110,18,32,0.08)] md:p-6">
      <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--blood-deep)]">
        {heading}
      </h3>
      <p className="mt-1 text-sm text-[color-mix(in_oklab,var(--ink)_60%,white)]">
        {t.healthcareCalendarHint}
      </p>

      {bookSuccess ? (
        <p className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {bookSuccess}
        </p>
      ) : null}

      <label className="mt-4 block text-sm">
        <span className="mb-1 block font-medium">{t.healthcareSelectDoctor}</span>
        <select
          className="field"
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value)}
        >
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {doctorLabel(d)}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-5 rounded-xl border border-[var(--line)] bg-white/90 p-4">
        <div className="mb-3 flex items-center justify-between">
          <button type="button" className="btn-ghost px-2 py-1 text-sm" onClick={() => shiftMonth(-1)}>
            ←
          </button>
          <p className="font-semibold text-[var(--ink)]">{monthLabel}</p>
          <button type="button" className="btn-ghost px-2 py-1 text-sm" onClick={() => shiftMonth(1)}>
            →
          </button>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase text-[color-mix(in_oklab,var(--ink)_50%,white)]">
          {WEEKDAY_KEYS.map((key) => (
            <span key={key}>{t[key]}</span>
          ))}
        </div>

        {loadingDays ? (
          <p className="py-6 text-center text-sm">{t.loading}</p>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, idx) => {
              if (cell.day === null) {
                return <span key={`empty-${idx}`} />;
              }
              const info = cell.info;
              const isAvailable = Boolean(info?.available);
              const isFull = Boolean(info?.hasSchedule && !info?.available);
              const isSelected = selectedDate === cell.dateStr;
              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  disabled={!isAvailable}
                  title={
                    isAvailable
                      ? `${info?.remaining}/${info?.maxPatients} ${t.healthcareSlotsLeft}`
                      : isFull
                        ? t.healthcareDayFull
                        : t.healthcareDayClosed
                  }
                  className={`aspect-square rounded-lg text-sm font-semibold transition ${
                    isSelected
                      ? "ring-2 ring-[var(--blood-deep)] ring-offset-1"
                      : ""
                  } ${
                    isAvailable
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : isFull
                        ? "bg-red-400 text-white cursor-not-allowed"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                  onClick={() => setSelectedDate(cell.dateStr)}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded bg-green-500" /> {t.healthcareAvailable}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded bg-red-400" /> {t.healthcareFull}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded bg-gray-100" /> {t.healthcareDayClosed}
          </span>
        </div>
      </div>

      {selectedDate && selectedInfo ? (
        <form className="mt-5 space-y-4" onSubmit={(e) => void submitBooking(e)}>
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
            {t.healthcareSelectedDate}:{" "}
            <strong>{new Date(selectedDate + "T12:00:00").toLocaleDateString(locale === "bn" ? "bn-BD" : "en")}</strong>
            {" · "}
            {selectedInfo.remaining}/{selectedInfo.maxPatients} {t.healthcareSlotsLeft}
            {" · "}
            {t.healthcareNextSerial}:{" "}
            <strong>{nextSerial || "…"}</strong>
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="field"
              required
              placeholder={t.healthcarePatientName}
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />
            <input
              className="field"
              required
              type="tel"
              placeholder={t.healthcarePatientPhone}
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
            />
          </div>
          <textarea
            className="field min-h-[72px]"
            placeholder={t.healthcareNotesPlaceholder}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          {bookError ? <p className="text-sm text-[var(--blood)]">{bookError}</p> : null}
          <button type="submit" className="btn-glass-primary" disabled={booking}>
            {booking ? t.loading : buttonLabel}
          </button>
        </form>
      ) : null}
    </section>
  );
}

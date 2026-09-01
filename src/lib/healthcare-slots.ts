import type { HealthcareAppointment, HealthcareDoctor } from "@/lib/healthcare-platform";

export type DayCapacity = {
  date: string;
  available: boolean;
  maxPatients: number;
  booked: number;
  remaining: number;
  hasSchedule: boolean;
};

export type DayBookingInfo = {
  date: string;
  maxPatients: number;
  booked: number;
  remaining: number;
  nextSerial: string;
};

const BD_OFFSET_MS = 6 * 60 * 60 * 1000;

function bdDateParts(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return { y: y!, m: m!, d: d! };
}

function slotIso(dateStr: string, time: string): string {
  const { y, m, d } = bdDateParts(dateStr);
  const [hh, mm] = time.split(":").map(Number);
  const utcMs = Date.UTC(y, m - 1, d, (hh ?? 0) - 6, mm ?? 0);
  return new Date(utcMs).toISOString();
}

function weekdayForDate(dateStr: string): number {
  const { y, m, d } = bdDateParts(dateStr);
  return new Date(Date.UTC(y, m - 1, d, 6)).getUTCDay();
}

function todayBdDateStr(): string {
  const now = new Date(Date.now() + BD_OFFSET_MS);
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function appointmentDate(a: HealthcareAppointment): string {
  return (a.slotStart || a.scheduledAt).slice(0, 10);
}

export function activeAppointments(appointments: HealthcareAppointment[], doctorId: string) {
  return appointments.filter(
    (a) => a.doctorId === doctorId && a.status !== "cancelled",
  );
}

export function bookedCountForDay(
  appointments: HealthcareAppointment[],
  doctorId: string,
  dateStr: string,
): number {
  return activeAppointments(appointments, doctorId).filter(
    (a) => appointmentDate(a) === dateStr,
  ).length;
}

export function maxPatientsForDay(doctor: HealthcareDoctor, dateStr: string): number {
  const weekday = weekdayForDate(dateStr);
  const daySchedules = doctor.schedules.filter((s) => s.weekday === weekday);
  if (!daySchedules.length) return 0;
  return daySchedules.reduce((sum, s) => sum + Math.max(1, s.maxPatients || 20), 0);
}

export function getDayCapacity(
  doctor: HealthcareDoctor,
  dateStr: string,
  appointments: HealthcareAppointment[],
): DayCapacity {
  const maxPatients = maxPatientsForDay(doctor, dateStr);
  const booked = bookedCountForDay(appointments, doctor.id, dateStr);
  const hasSchedule = maxPatients > 0;
  const remaining = Math.max(0, maxPatients - booked);
  return {
    date: dateStr,
    available: hasSchedule && remaining > 0,
    maxPatients,
    booked,
    remaining,
    hasSchedule,
  };
}

export function getMonthAvailability(
  doctor: HealthcareDoctor,
  year: number,
  month: number,
  appointments: HealthcareAppointment[],
): DayCapacity[] {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const today = todayBdDateStr();
  const days: DayCapacity[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (dateStr < today) {
      days.push({
        date: dateStr,
        available: false,
        maxPatients: 0,
        booked: 0,
        remaining: 0,
        hasSchedule: false,
      });
      continue;
    }
    days.push(getDayCapacity(doctor, dateStr, appointments));
  }

  return days;
}

export function nextSerialNumber(
  doctorId: string,
  dateStr: string,
  appointments: HealthcareAppointment[],
): string {
  const count = bookedCountForDay(appointments, doctorId, dateStr);
  return String(count + 1).padStart(3, "0");
}

export function getDayBookingInfo(
  doctor: HealthcareDoctor,
  dateStr: string,
  appointments: HealthcareAppointment[],
): DayBookingInfo | null {
  const capacity = getDayCapacity(doctor, dateStr, appointments);
  if (!capacity.available) return null;
  return {
    date: dateStr,
    maxPatients: capacity.maxPatients,
    booked: capacity.booked,
    remaining: capacity.remaining,
    nextSerial: nextSerialNumber(doctor.id, dateStr, appointments),
  };
}

export function bookingTimesForDay(
  doctor: HealthcareDoctor,
  dateStr: string,
): { slotStart: string; slotEnd: string } {
  const weekday = weekdayForDate(dateStr);
  const sched =
    doctor.schedules.find((s) => s.weekday === weekday) ?? doctor.schedules[0];
  return {
    slotStart: slotIso(dateStr, sched?.startTime || "09:00"),
    slotEnd: slotIso(dateStr, sched?.endTime || "17:00"),
  };
}

export function canBookDate(
  doctor: HealthcareDoctor,
  dateStr: string,
  appointments: HealthcareAppointment[],
): boolean {
  return getDayCapacity(doctor, dateStr, appointments).available;
}

import type { HealthcareAppointment, HealthcareDoctor } from "@/lib/healthcare-platform";
import { deliverHealthcareSms } from "@/lib/otp-delivery";

function formatWhen(iso: string, locale = "bn-BD") {
  try {
    return new Date(iso).toLocaleString(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export async function sendAppointmentConfirmedSms(input: {
  appointment: HealthcareAppointment;
  doctor: HealthcareDoctor;
  facilityName: string;
  locale?: string;
}) {
  const { appointment, doctor, facilityName } = input;
  const when = formatWhen(appointment.slotStart || appointment.scheduledAt);
  const message = `BloodLink স্বাস্থ্য: আপনার অ্যাপয়েন্টমেন্ট নিশ্চিত। সিরিয়াল #${appointment.serialNumber} | ${doctor.nameBn || doctor.name} | ${when} | ${facilityName}। Serial PDF ডাউনলোড করুন: bloodlinkbd.org/healthcare`;
  return deliverHealthcareSms(appointment.patientPhone, message);
}

export async function sendAppointmentCancelledSms(input: {
  appointment: HealthcareAppointment;
  doctor: HealthcareDoctor;
  facilityName: string;
}) {
  const when = formatWhen(input.appointment.slotStart || input.appointment.scheduledAt);
  const message = `BloodLink স্বাস্থ্য: আপনার অ্যাপয়েন্টমেন্ট #${input.appointment.serialNumber} (${when}) বাতিল হয়েছে। ${input.facilityName} — প্রশ্নে কল করুন।`;
  return deliverHealthcareSms(input.appointment.patientPhone, message);
}

export async function sendAppointmentRescheduledSms(input: {
  appointment: HealthcareAppointment;
  doctor: HealthcareDoctor;
  facilityName: string;
  previousWhen: string;
}) {
  const when = formatWhen(input.appointment.slotStart || input.appointment.scheduledAt);
  const prev = formatWhen(input.previousWhen);
  const message = `BloodLink স্বাস্থ্য: অ্যাপয়েন্টমেন্ট #${input.appointment.serialNumber} পরিবর্তন। নতুন সময়: ${when} (আগে ${prev}) | ${input.doctor.nameBn || input.doctor.name} | ${input.facilityName}`;
  return deliverHealthcareSms(input.appointment.patientPhone, message);
}

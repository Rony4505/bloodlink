"use client";

import { useLocale } from "@/lib/i18n/locale-context";

type DoctorOption = {
  id: string;
  name: string;
  nameBn: string;
  specialty: string;
  specialtyBn: string;
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
  appointment: BookedAppointment;
  doctor: DoctorOption;
  facilityName: string;
  smsSent: boolean | null;
  onBookAnother: () => void;
};

export function HealthcareAppointmentSlip({
  appointment,
  doctor,
  facilityName,
  smsSent,
  onBookAnother,
}: Props) {
  const { t, locale } = useLocale();

  const doctorName = locale === "bn" && doctor.nameBn ? doctor.nameBn : doctor.name;
  const specialty =
    locale === "bn" && doctor.specialtyBn ? doctor.specialtyBn : doctor.specialty;
  const when = new Date(appointment.slotStart || appointment.scheduledAt).toLocaleString(
    locale === "bn" ? "bn-BD" : "en",
    { dateStyle: "full", timeStyle: "short" },
  );

  function printSlip() {
    window.print();
  }

  return (
    <section className="healthcare-slip space-y-5">
      <div className="healthcare-slip-print rounded-2xl border-2 border-[var(--blood-deep)] bg-white p-6 shadow-[0_12px_36px_rgba(110,18,32,0.1)]">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--blood)]">
            BloodLink {t.healthcareNav}
          </p>
          <p className="mt-4 font-[family-name:var(--font-display)] text-5xl font-bold tabular-nums text-[var(--blood-deep)]">
            #{appointment.serialNumber}
          </p>
          <p className="mt-1 text-sm text-[color-mix(in_oklab,var(--ink)_55%,white)]">
            {t.healthcareSerialNumber}
          </p>
        </div>

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-[var(--line)] pb-2">
            <dt className="text-[color-mix(in_oklab,var(--ink)_55%,white)]">{t.healthcarePatientName}</dt>
            <dd className="font-semibold text-right">{appointment.patientName}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-[var(--line)] pb-2">
            <dt className="text-[color-mix(in_oklab,var(--ink)_55%,white)]">{t.healthcarePatientPhone}</dt>
            <dd className="font-semibold text-right">{appointment.patientPhone}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-[var(--line)] pb-2">
            <dt className="text-[color-mix(in_oklab,var(--ink)_55%,white)]">{t.healthcareSelectDoctor}</dt>
            <dd className="font-semibold text-right">
              {doctorName}
              {specialty ? ` — ${specialty}` : ""}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-[var(--line)] pb-2">
            <dt className="text-[color-mix(in_oklab,var(--ink)_55%,white)]">{t.healthcarePreferredTime}</dt>
            <dd className="font-semibold text-right">{when}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[color-mix(in_oklab,var(--ink)_55%,white)]">{t.healthcareInstitutionTitle}</dt>
            <dd className="font-semibold text-right">{facilityName}</dd>
          </div>
        </dl>

        <p className="mt-6 rounded-lg bg-green-50 px-3 py-2 text-center text-sm text-green-800">
          {t.healthcareBookSuccess}
        </p>
      </div>

      {smsSent === true ? (
        <p className="text-sm text-green-700">{t.healthcareSmsSent}</p>
      ) : smsSent === false ? (
        <p className="text-sm text-[color-mix(in_oklab,var(--ink)_55%,white)]">{t.healthcareSmsNotSent}</p>
      ) : null}

      <div className="healthcare-slip-actions flex flex-wrap gap-3">
        <button type="button" className="btn-glass-primary" onClick={printSlip}>
          {t.healthcareDownloadPdf}
        </button>
        <button type="button" className="btn-ghost" onClick={onBookAnother}>
          {t.healthcareBookAnother}
        </button>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .healthcare-slip,
          .healthcare-slip * {
            visibility: visible;
          }
          .healthcare-slip {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .healthcare-slip-actions {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}

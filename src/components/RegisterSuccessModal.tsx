"use client";

import { useEffect } from "react";
import { invalidateDonorStats } from "@/lib/donor-stats-client";
import { useLocale } from "@/lib/i18n/locale-context";

export type RegisteredDonorSummary = {
  name: string;
  email: string;
  phone: string;
  gender: "male" | "female";
  bloodGroup: string;
  district: string;
  area: string;
  available: boolean;
  lastDonationDate: string | null;
  nextEligibleDate: string | null;
  bloodIssue: string;
};

type Props = {
  donor: RegisteredDonorSummary;
  onContinue: () => void;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/90 px-3.5 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[color-mix(in_oklab,var(--ink)_48%,white)]">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold leading-snug text-[var(--ink)]">
        {value}
      </p>
    </div>
  );
}

export function RegisterSuccessModal({ donor, onContinue }: Props) {
  const { t } = useLocale();

  useEffect(() => {
    invalidateDonorStats();
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/55 p-4 backdrop-blur-[2px] sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-success-title"
        className="animate-[rise_0.35s_ease-out] max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-[var(--line)] bg-[linear-gradient(165deg,#fff8f4_0%,var(--mist)_45%,#f3ebe4_100%)] p-6 shadow-2xl sm:p-8"
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--sage)_18%,white)] text-3xl text-[var(--sage)] ring-8 ring-[color-mix(in_oklab,var(--sage)_10%,transparent)]">
            ✓
          </div>
          <h2
            id="register-success-title"
            className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[var(--blood-deep)] sm:text-4xl"
          >
            {t.registerSuccessTitle}
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-[color-mix(in_oklab,var(--ink)_72%,white)] sm:text-base">
            {t.registerSuccessBody}
          </p>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--sand)_35%,white)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-4">
            <div className="text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[color-mix(in_oklab,var(--ink)_50%,white)]">
                {t.registerSuccessSummary}
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
                {donor.name}
              </p>
            </div>
            <div className="flex h-14 min-w-14 items-center justify-center rounded-2xl bg-[var(--blood)] px-3 font-[family-name:var(--font-display)] text-2xl font-bold text-white shadow-sm">
              {donor.bloodGroup}
            </div>
          </div>

          <div className="space-y-4 p-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[color-mix(in_oklab,var(--ink)_50%,white)]">
                {t.personalInfo}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Row label={t.email} value={donor.email} />
                <Row label={t.phone} value={donor.phone} />
                <Row
                  label={t.gender}
                  value={donor.gender === "female" ? t.female : t.male}
                />
                <Row
                  label={t.district}
                  value={`${donor.district}${donor.area ? ` · ${donor.area}` : ""}`}
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[color-mix(in_oklab,var(--ink)_50%,white)]">
                {t.donationInfo}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Row
                  label={t.status}
                  value={donor.available ? t.available : t.unavailable}
                />
                <Row
                  label={t.lastDonation}
                  value={donor.lastDonationDate || t.neverDonated}
                />
                <Row
                  label={t.nextEligible}
                  value={donor.nextEligibleDate || t.unknown}
                />
                <Row
                  label={t.bloodIssue}
                  value={donor.bloodIssue?.trim() ? donor.bloodIssue : t.noBloodIssue}
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#2f6b4f] px-5 py-3.5 text-base font-semibold text-white transition hover:bg-[#265a42]"
        >
          {t.registerSuccessCta}
        </button>
      </div>
    </div>
  );
}

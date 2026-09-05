"use client";

import { useEffect, useState } from "react";
import { invalidateDonorStats } from "@/lib/donor-stats-client";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  markPushPromptAccepted,
  snoozePushPrompt,
} from "@/lib/push-prompt-state";
import { enableWebPush } from "@/lib/web-push-client";

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
  const [pushBusy, setPushBusy] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushDone, setPushDone] = useState<"idle" | "on" | "skipped" | "denied">(
    "idle",
  );
  const showPushPrompt = pushSupported && pushDone === "idle";

  useEffect(() => {
    invalidateDonorStats();
    // Show Allow on every browser (iPhone Safari/Chrome included).
    setPushSupported(true);
  }, []);

  async function onAllowPush() {
    setPushBusy(true);
    try {
      const result = await enableWebPush({ recordIntent: true });
      if (result === "granted" || result === "permission_only") {
        markPushPromptAccepted();
        setPushDone("on");
      } else if (result === "denied") {
        // Browser blocked — short pause; login later will ask again if possible
        snoozePushPrompt(1);
        setPushDone("denied");
      } else {
        // Subscribe failed — keep asking on next login (no long snooze)
        setPushDone("skipped");
      }
    } catch {
      setPushDone("skipped");
    } finally {
      setPushBusy(false);
    }
  }

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

        {showPushPrompt ? (
          <div className="mt-5 rounded-2xl border border-[color-mix(in_oklab,var(--blood)_22%,transparent)] bg-[linear-gradient(160deg,#fff4f1,#ffffff)] px-4 py-4 text-left">
            <p className="text-sm font-semibold text-[var(--blood-deep)]">
              {t.registerPushTitle}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[color-mix(in_oklab,var(--ink)_65%,white)]">
              {t.registerPushBody}
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={pushBusy}
                onClick={() => void onAllowPush()}
                className="inline-flex flex-1 items-center justify-center rounded-full bg-[var(--blood)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--blood-deep)] disabled:opacity-60"
              >
                {pushBusy ? t.loading : t.registerPushAllow}
              </button>
              <button
                type="button"
                disabled={pushBusy}
                onClick={() => {
                  // No long snooze — DonorPushEnableGate will ask again on next login
                  setPushDone("skipped");
                }}
                className="inline-flex flex-1 items-center justify-center rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--mist)] disabled:opacity-60"
              >
                {t.registerPushSkip}
              </button>
            </div>
          </div>
        ) : null}

        {pushDone === "on" ? (
          <p className="mt-4 text-center text-sm font-medium text-[var(--sage)]">
            {t.registerPushOn}
          </p>
        ) : null}
        {pushDone === "denied" ? (
          <p className="mt-4 text-center text-sm font-medium text-[var(--blood)]">
            {t.pushDenied}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => {
            // Skip / leave without Allow → ask again on every next login
            onContinue();
          }}
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#2f6b4f] px-5 py-3.5 text-base font-semibold text-white transition hover:bg-[#265a42]"
        >
          {t.registerSuccessCta}
        </button>
      </div>
    </div>
  );
}

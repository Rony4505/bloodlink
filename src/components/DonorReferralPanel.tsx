"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";

type ReferralEvent = {
  id: string;
  referredName: string;
  referredPhone: string;
  status: "credited" | "missed" | "pending_push";
  missReason: string | null;
  rewardBdt: number;
  createdAt: string;
};

type Withdrawal = {
  id: string;
  amountBdt: number;
  method: "bkash" | "nagad";
  accountNumber: string;
  status: "pending" | "paid" | "rejected";
  createdAt: string;
};

type Dashboard = {
  settings: {
    enabled: boolean;
    rewardAmountBdt: number;
    maxSuccessfulRefs: number;
    minSuccessfulForWithdraw: number;
    rulesBn: string;
    rulesEn: string;
    cashOutEnabled: boolean;
    campaignActive: boolean;
  };
  referralCode: string;
  referralClosed: boolean;
  rulesAcceptedAt: string | null;
  payout: { bkash: string; nagad: string };
  successfulCount: number;
  pendingCount: number;
  missedCount: number;
  earnedBdt: number;
  availableBdt: number;
  canWithdraw: boolean;
  events: ReferralEvent[];
  withdrawals: Withdrawal[];
};

type IntroStep = "purpose" | "rules";

export function DonorReferralPanel() {
  const { t, locale } = useLocale();
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [bkash, setBkash] = useState("");
  const [nagad, setNagad] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState<"bkash" | "nagad">("bkash");
  const [introStep, setIntroStep] = useState<IntroStep>("purpose");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/donors/me/referral", { cache: "no-store" });
      if (!res.ok) {
        setError(t.errorGeneric);
        setData(null);
        return;
      }
      const json = await res.json();
      setData(json);
      setBkash(json.payout?.bkash || "");
      setNagad(json.payout?.nagad || "");
      if (json.payout?.nagad && !json.payout?.bkash) setWithdrawMethod("nagad");
      if (!json.rulesAcceptedAt) setIntroStep("purpose");
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [t.errorGeneric]);

  useEffect(() => {
    void load();
  }, [load]);

  const referralLink = useMemo(() => {
    if (!data?.referralCode || typeof window === "undefined") return "";
    return `${window.location.origin}/r/${encodeURIComponent(data.referralCode)}`;
  }, [data?.referralCode]);

  const rulesText =
    locale === "bn"
      ? data?.settings.rulesBn || ""
      : data?.settings.rulesEn || data?.settings.rulesBn || "";

  const payoutLocked = Boolean(
    data?.payout?.bkash?.trim() || data?.payout?.nagad?.trim(),
  );

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/donors/me/referral", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || t.errorGeneric);
        return;
      }
      setData(json);
      setBkash(json.payout?.bkash || "");
      setNagad(json.payout?.nagad || "");
      setMessage(t.saved);
    } catch {
      setError(t.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    const value = referralLink || data?.referralCode || "";
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* ignore */
    }
    setCopied(true);
    setMessage(t.referralLinkCopied);
    window.setTimeout(() => setCopied(false), 2500);
  }

  if (loading) {
    return (
      <section className="rounded-[28px] border border-[var(--line)] bg-white/85 p-5 shadow-sm">
        <p className="text-sm text-[color-mix(in_oklab,var(--ink)_70%,white)]">{t.loading}</p>
      </section>
    );
  }

  if (!data?.settings.enabled) {
    return (
      <section className="rounded-[28px] border border-[var(--line)] bg-white/85 p-5 shadow-sm">
        <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--blood-deep)]">
          {t.referralPanelTitle}
        </h3>
        <p className="mt-2 text-sm text-[color-mix(in_oklab,var(--ink)_72%,white)]">
          {t.referralCampaignOff}
        </p>
      </section>
    );
  }

  const remaining = Math.max(
    0,
    data.settings.maxSuccessfulRefs - data.successfulCount,
  );

  return (
    <section className="space-y-4 rounded-[28px] border border-[var(--line)] bg-white/85 p-5 shadow-sm">
      <div>
        <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--blood-deep)]">
          {t.referralPanelTitle}
        </h3>
        <p className="mt-1 text-sm text-[color-mix(in_oklab,var(--ink)_72%,white)]">
          {t.referralPanelHint}
        </p>
      </div>

      {error ? <p className="text-sm text-[var(--blood)]">{error}</p> : null}
      {message ? <p className="text-sm text-[var(--sage)]">{message}</p> : null}

      {!data.rulesAcceptedAt ? (
        <div className="space-y-3 rounded-2xl border border-[rgba(155,27,46,0.18)] bg-[color-mix(in_oklab,var(--sand)_22%,white)] p-4">
          {introStep === "purpose" ? (
            <>
              <p className="font-semibold text-[var(--blood-deep)]">
                {t.referralPurposeTitle}
              </p>
              <div className="space-y-2 rounded-xl bg-white/90 p-3 text-sm leading-relaxed text-[var(--ink)]">
                <p>{t.referralPurposeBody1}</p>
                <p>{t.referralPurposeBody2}</p>
                <p>{t.referralPurposeBody3}</p>
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setIntroStep("rules")}
              >
                {t.referralPurposeNext}
              </button>
            </>
          ) : (
            <>
              <p className="font-semibold text-[var(--blood-deep)]">
                {t.referralRulesTitle}
              </p>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-white/90 p-3 text-xs leading-relaxed text-[var(--ink)]">
                {rulesText}
              </pre>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setIntroStep("purpose")}
                >
                  {t.referralPurposeBack}
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={busy}
                  onClick={() => void patch({ action: "accept-rules" })}
                >
                  {t.referralAcceptRules}
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label={t.referralSuccessful} value={String(data.successfulCount)} />
            <Stat label={t.referralRemaining} value={String(remaining)} />
            <Stat label={t.referralEarned} value={`৳${data.earnedBdt}`} />
            <Stat label={t.referralAvailable} value={`৳${data.availableBdt}`} />
          </div>

          {data.referralClosed ? (
            <p className="rounded-xl bg-[color-mix(in_oklab,var(--blood)_10%,white)] px-3 py-2 text-sm font-semibold text-[var(--blood-deep)]">
              {t.referralClosedNotice}
            </p>
          ) : null}

          <div className="rounded-2xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--sand)_18%,white)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color-mix(in_oklab,var(--ink)_55%,white)]">
              {t.referralYourLink}
            </p>
            <p className="mt-2 break-all font-mono text-sm font-semibold text-[var(--ink)]">
              {referralLink || data.referralCode}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" className="btn-ghost" onClick={() => void copyLink()}>
                {t.referralCopyLink}
              </button>
              {copied ? (
                <span className="text-sm font-semibold text-[var(--sage)]">
                  {t.referralLinkCopied}
                </span>
              ) : null}
            </div>
          </div>

          <details className="rounded-2xl border border-[var(--line)] bg-white/90 p-4">
            <summary className="cursor-pointer font-semibold text-[var(--blood-deep)]">
              {t.referralRulesTitle}
            </summary>
            <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap text-xs leading-relaxed">
              {rulesText}
            </pre>
          </details>

          <form
            className="space-y-3 rounded-2xl border border-[var(--line)] p-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (payoutLocked) return;
              void patch({ action: "save-payout", bkash, nagad });
            }}
          >
            <p className="font-semibold text-[var(--blood-deep)]">{t.referralPayoutTitle}</p>
            <p className="text-xs text-[color-mix(in_oklab,var(--ink)_70%,white)]">
              {payoutLocked ? t.referralPayoutLocked : t.referralPayoutHint}
            </p>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">bKash</span>
              <input
                className="field"
                value={bkash}
                onChange={(e) => setBkash(e.target.value)}
                placeholder="01XXXXXXXXX"
                disabled={payoutLocked}
                readOnly={payoutLocked}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Nagad</span>
              <input
                className="field"
                value={nagad}
                onChange={(e) => setNagad(e.target.value)}
                placeholder="01XXXXXXXXX"
                disabled={payoutLocked}
                readOnly={payoutLocked}
              />
            </label>
            {!payoutLocked ? (
              <button type="submit" className="btn-primary" disabled={busy}>
                {busy ? t.loading : t.saveChanges}
              </button>
            ) : null}
          </form>

          <div className="rounded-2xl border border-[var(--line)] p-4">
            <p className="font-semibold text-[var(--blood-deep)]">{t.referralWithdrawTitle}</p>
            <p className="mt-1 text-xs text-[color-mix(in_oklab,var(--ink)_70%,white)]">
              {t.referralWithdrawHint.replace(
                "{min}",
                String(data.settings.minSuccessfulForWithdraw),
              )}
            </p>
            {!data.canWithdraw ? (
              <p className="mt-3 text-sm font-medium text-[color-mix(in_oklab,var(--ink)_75%,white)]">
                {t.referralWithdrawLocked}
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <label className="text-sm">
                  <span className="mb-1 block font-medium">{t.referralWithdrawMethod}</span>
                  <select
                    className="field"
                    value={withdrawMethod}
                    onChange={(e) =>
                      setWithdrawMethod(e.target.value as "bkash" | "nagad")
                    }
                  >
                    <option value="bkash">bKash</option>
                    <option value="nagad">Nagad</option>
                  </select>
                </label>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={busy}
                  onClick={() =>
                    void patch({
                      action: "request-withdraw",
                      method: withdrawMethod,
                    })
                  }
                >
                  {t.referralRequestWithdraw}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-[var(--blood-deep)]">{t.referralAccountsTitle}</p>
            {!data.events.length ? (
              <p className="text-sm text-[color-mix(in_oklab,var(--ink)_65%,white)]">
                {t.referralNoAccountsYet}
              </p>
            ) : (
              <ul className="space-y-2">
                {data.events.map((e) => (
                  <li
                    key={e.id}
                    className="rounded-xl border border-[var(--line)] bg-white/90 px-3 py-2 text-sm"
                  >
                    <p className="font-semibold">
                      {e.referredName} · {e.referredPhone}
                    </p>
                    <p className="text-xs text-[color-mix(in_oklab,var(--ink)_65%,white)]">
                      {e.status}
                      {e.missReason ? ` · ${e.missReason}` : ""}
                      {e.status === "credited" ? ` · ৳${e.rewardBdt}` : ""}
                      {" · "}
                      {new Date(e.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {data.withdrawals.length ? (
            <div className="space-y-2">
              <p className="font-semibold text-[var(--blood-deep)]">
                {t.referralWithdrawHistory}
              </p>
              <ul className="space-y-2">
                {data.withdrawals.map((w) => (
                  <li
                    key={w.id}
                    className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm"
                  >
                    ৳{w.amountBdt} · {w.method} · {w.accountNumber} · {w.status}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--sand)_16%,white)] px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[color-mix(in_oklab,var(--ink)_55%,white)]">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-[var(--blood-deep)]">{value}</p>
    </div>
  );
}

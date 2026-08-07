"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DailyReminder } from "@/components/DailyReminder";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { BLOOD_GROUPS, DISTRICTS } from "@/lib/districts";
import { useLocale } from "@/lib/i18n/locale-context";

type Donor = {
  id: string;
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
  waitDays: number;
  bloodIssue: string;
  avgRating: number | null;
  ratingCount: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  verified: boolean;
};

export function DashboardClient() {
  const { t } = useLocale();
  const router = useRouter();
  const [donor, setDonor] = useState<Donor | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifyChannel, setVerifyChannel] = useState<"email" | "phone">(
    "phone",
  );
  const [verifyCode, setVerifyCode] = useState("");
  const [tempCode, setTempCode] = useState("");
  const [verifyBusy, setVerifyBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) {
          router.replace("/login");
          return;
        }
        const data = await res.json();
        setDonor(data.donor);
      })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!donor) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/donors/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: donor.name,
          phone: donor.phone,
          gender: donor.gender,
          bloodGroup: donor.bloodGroup,
          district: donor.district,
          area: donor.area,
          lastDonationDate: donor.lastDonationDate,
          bloodIssue: donor.bloodIssue,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errorGeneric);
        return;
      }
      setDonor(data.donor);
      setMessage(t.saved);
    } catch {
      setError(t.errorGeneric);
    } finally {
      setSaving(false);
    }
  }

  async function sendVerifyCode() {
    if (!donor) return;
    setVerifyBusy(true);
    setError("");
    setMessage("");
    setTempCode("");
    try {
      const res = await fetch("/api/auth/verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: verifyChannel }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errorGeneric);
        return;
      }
      if (data.donor) setDonor(data.donor);
      setTempCode(data.code || "");
      setMessage(t.codeSent);
    } catch {
      setError(t.errorGeneric);
    } finally {
      setVerifyBusy(false);
    }
  }

  async function confirmVerify() {
    if (!donor || !verifyCode.trim()) return;
    setVerifyBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/auth/verify/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: verifyChannel, code: verifyCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errorGeneric);
        return;
      }
      if (data.donor) setDonor(data.donor);
      setVerifyCode("");
      setTempCode("");
      setMessage(t.verified);
    } catch {
      setError(t.errorGeneric);
    } finally {
      setVerifyBusy(false);
    }
  }

  if (loading || !donor) {
    return (
      <p className="text-[color-mix(in_oklab,var(--ink)_65%,white)]">{t.loading}</p>
    );
  }

  return (
    <>
      <DailyReminder enabled />

      <section className="mb-4 space-y-3 rounded-2xl bg-white/80 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
            {t.verifyDonorTitle}
          </h2>
          <VerifiedBadge
            verified={donor.verified}
            emailVerified={donor.emailVerified}
            phoneVerified={donor.phoneVerified}
          />
        </div>
        <p className="text-sm text-[color-mix(in_oklab,var(--ink)_70%,white)]">
          {t.verifyDonorBody}
        </p>
        {!donor.verified ? (
          <p className="text-sm font-medium text-[var(--blood-deep)]">
            {t.mustVerifyHint}
          </p>
        ) : null}
        <p className="text-sm">
          {t.verifyEmail}: {donor.emailVerified ? t.verified : t.notVerified} ·{" "}
          {t.verifyPhone}: {donor.phoneVerified ? t.verified : t.notVerified}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={verifyChannel === "phone" ? "btn-primary" : "btn-ghost"}
            onClick={() => setVerifyChannel("phone")}
          >
            {t.usePhone}
          </button>
          <button
            type="button"
            className={verifyChannel === "email" ? "btn-primary" : "btn-ghost"}
            onClick={() => setVerifyChannel("email")}
          >
            {t.useEmail}
          </button>
        </div>
        <button
          type="button"
          className="btn-ghost"
          disabled={verifyBusy}
          onClick={sendVerifyCode}
        >
          {verifyBusy ? t.loading : t.sendVerifyCode}
        </button>
        {tempCode ? (
          <p className="rounded-xl bg-[color-mix(in_oklab,var(--blood)_8%,white)] px-3 py-2 text-sm text-[var(--blood-deep)]">
            {t.yourCode}: <strong>{tempCode}</strong>
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="field"
            placeholder={t.enterCode}
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value)}
          />
          <button
            type="button"
            className="btn-primary"
            disabled={verifyBusy || !verifyCode.trim()}
            onClick={confirmVerify}
          >
            {t.verify}
          </button>
        </div>
      </section>

      <form onSubmit={save} className="space-y-3 rounded-2xl bg-white/80 p-6">
        <div
          className={`rounded-xl px-4 py-3 text-sm font-semibold ${
            donor.available
              ? "bg-[color-mix(in_oklab,var(--sage)_12%,white)] text-[var(--sage)]"
              : "bg-[color-mix(in_oklab,var(--blood)_10%,white)] text-[var(--blood-deep)]"
          }`}
        >
          <p>{donor.available ? t.available : t.unavailable}</p>
          <p className="mt-1 text-xs font-normal opacity-90">{t.waitRule}</p>
          {!donor.available && donor.nextEligibleDate ? (
            <p className="mt-1 text-xs font-medium">
              {t.nextEligible}: {donor.nextEligibleDate}
            </p>
          ) : null}
          {donor.avgRating != null ? (
            <p className="mt-1 text-xs">
              {t.rating}: ★ {donor.avgRating} ({donor.ratingCount})
            </p>
          ) : null}
        </div>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t.name}</span>
          <input
            className="field"
            value={donor.name}
            onChange={(e) => setDonor({ ...donor, name: e.target.value })}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t.email}</span>
          <input className="field" value={donor.email} disabled />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t.phone}</span>
          <input
            className="field"
            value={donor.phone}
            onChange={(e) => setDonor({ ...donor, phone: e.target.value })}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t.gender}</span>
          <select
            className="field"
            value={donor.gender}
            onChange={(e) =>
              setDonor({
                ...donor,
                gender: e.target.value as "male" | "female",
              })
            }
          >
            <option value="male">{t.male}</option>
            <option value="female">{t.female}</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t.bloodGroup}</span>
          <select
            className="field"
            value={donor.bloodGroup}
            onChange={(e) => setDonor({ ...donor, bloodGroup: e.target.value })}
          >
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t.district}</span>
          <select
            className="field"
            value={donor.district}
            onChange={(e) => setDonor({ ...donor, district: e.target.value })}
          >
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t.area}</span>
          <input
            className="field"
            value={donor.area}
            onChange={(e) => setDonor({ ...donor, area: e.target.value })}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t.lastDonation}</span>
          <input
            className="field"
            type="date"
            value={donor.lastDonationDate || ""}
            onChange={(e) =>
              setDonor({ ...donor, lastDonationDate: e.target.value || null })
            }
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t.bloodIssue}</span>
          <textarea
            className="field min-h-20"
            value={donor.bloodIssue || ""}
            onChange={(e) => setDonor({ ...donor, bloodIssue: e.target.value })}
            placeholder={t.bloodIssueHint}
          />
        </label>
        {error ? <p className="text-sm text-[var(--blood)]">{error}</p> : null}
        {message ? <p className="text-sm text-[var(--sage)]">{message}</p> : null}
        <button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving ? t.loading : t.saveChanges}
        </button>
      </form>
    </>
  );
}

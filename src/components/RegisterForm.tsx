"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PasswordField } from "@/components/PasswordField";
import { areasForDistrict } from "@/lib/district-areas";
import { BLOOD_GROUPS, DISTRICTS } from "@/lib/districts";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  RegisterSuccessModal,
  type RegisteredDonorSummary,
} from "@/components/RegisterSuccessModal";

type Step = "form" | "otp";

export function RegisterForm() {
  const { t } = useLocale();
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingId, setPendingId] = useState("");
  const [emailMasked, setEmailMasked] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [hint, setHint] = useState("");
  const [successDonor, setSuccessDonor] = useState<RegisteredDonorSummary | null>(
    null,
  );
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    gender: "male",
    bloodGroup: "O+",
    district: "Dhaka",
    area: "",
    lastDonationDate: "",
    donationCount: 0,
    bloodIssue: "",
  });

  const areaOptions = areasForDistrict(form.district);

  async function sendOtps(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setHint("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          ...form,
          lastDonationDate: form.lastDonationDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errorGeneric);
        return;
      }
      setPendingId(data.pendingId);
      setEmailMasked(data.emailMasked || form.email);
      setEmailCode("");
      setHint(t.otpSentToEmail);
      setStep("otp");
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  async function confirmOtps(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          pendingId,
          emailCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errorGeneric);
        return;
      }
      setSuccessDonor(data.donor as RegisteredDonorSummary);
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend", pendingId, channel: "email" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errorGeneric);
        return;
      }
      setEmailCode("");
      setHint(t.otpResent);
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  if (step === "otp") {
    return (
      <>
        <form onSubmit={confirmOtps} className="space-y-5 rounded-2xl bg-white/80 p-6">
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--blood-deep)]">
              {t.otpVerifyTitle}
            </h3>
            <p className="mt-2 text-sm text-[color-mix(in_oklab,var(--ink)_70%,white)]">
              {t.otpVerifyBody.replace("{email}", emailMasked)}
            </p>
            {hint ? (
              <p className="mt-3 rounded-xl border border-[color-mix(in_oklab,#2f6b4f_30%,white)] bg-[color-mix(in_oklab,#2f6b4f_8%,white)] px-3 py-2 text-xs text-[#245a40]">
                {hint}
              </p>
            ) : null}
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t.otpEmailCode}</span>
            <input
              className="field tracking-[0.3em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={emailCode}
              onChange={(e) => setEmailCode(e.target.value)}
              required
              maxLength={10}
            />
          </label>
          {error ? <p className="text-sm text-[var(--blood)]">{error}</p> : null}
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-[#2f6b4f] px-5 py-3 font-semibold text-white transition hover:bg-[#265a42] disabled:opacity-55"
            disabled={loading}
          >
            {loading ? t.loading : t.otpConfirmCreate}
          </button>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <button
              type="button"
              className="font-semibold text-[var(--blood-deep)] underline"
              onClick={() => void resend()}
              disabled={loading}
            >
              {t.otpResend}
            </button>
            <button
              type="button"
              className="text-[color-mix(in_oklab,var(--ink)_60%,white)] underline"
              onClick={() => {
                setStep("form");
                setError("");
              }}
            >
              {t.otpBack}
            </button>
          </div>
        </form>
        {successDonor ? (
          <RegisterSuccessModal
            donor={successDonor}
            onContinue={() => router.push("/dashboard")}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <form onSubmit={sendOtps} className="space-y-5 rounded-2xl bg-white/80 p-6">
        <p className="rounded-xl border border-[color-mix(in_oklab,#2f6b4f_30%,white)] bg-[color-mix(in_oklab,#2f6b4f_8%,white)] px-3 py-2 text-xs text-[#245a40]">
          {t.otpRegisterNotice}
        </p>
        <section className="space-y-3">
          <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--blood-deep)]">
            {t.personalInfo}
          </h3>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t.name}</span>
            <input
              className="field"
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t.email}</span>
            <input
              className="field"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              autoComplete="email"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t.phone}</span>
            <input
              className="field"
              type="text"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="01XXXXXXXXX"
              required
            />
          </label>
          <PasswordField
            id="register-password"
            label={t.password}
            value={form.password}
            onChange={(value) => setForm((f) => ({ ...f, password: value }))}
            required
            autoComplete="new-password"
            hint={t.passwordHint}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t.gender}</span>
              <select
                className="field"
                value={form.gender}
                onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
              >
                <option value="male">{t.male}</option>
                <option value="female">{t.female}</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t.district}</span>
              <select
                className="field"
                value={form.district}
                onChange={(e) => {
                  const district = e.target.value;
                  const areas = areasForDistrict(district);
                  setForm((f) => ({
                    ...f,
                    district,
                    area: areas.includes(f.area) ? f.area : "",
                  }));
                }}
              >
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t.area}</span>
            <select
              className="field"
              value={form.area}
              onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
              required
            >
              <option value="">{t.selectArea}</option>
              {areaOptions.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="space-y-3 border-t border-[var(--line)] pt-5">
          <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--blood-deep)]">
            {t.donationInfo}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t.bloodGroup}</span>
              <select
                className="field"
                value={form.bloodGroup}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bloodGroup: e.target.value }))
                }
              >
                {BLOOD_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t.lastDonation}</span>
              <input
                className="field"
                type="date"
                value={form.lastDonationDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, lastDonationDate: e.target.value }))
                }
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t.donationCountField}</span>
            <input
              className="field"
              type="number"
              min={0}
              max={500}
              value={form.donationCount}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  donationCount: Number(e.target.value) || 0,
                }))
              }
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t.bloodIssue}</span>
            <textarea
              className="field min-h-20"
              value={form.bloodIssue}
              onChange={(e) => setForm((f) => ({ ...f, bloodIssue: e.target.value }))}
              placeholder={t.bloodIssueHint}
            />
          </label>
        </section>

        {error ? <p className="text-sm text-[var(--blood)]">{error}</p> : null}
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-full bg-[#2f6b4f] px-5 py-3 font-semibold text-white transition hover:bg-[#265a42] disabled:opacity-55"
          disabled={loading}
        >
          {loading ? t.loading : t.otpSendCodes}
        </button>
        <p className="text-center text-sm">
          {t.alreadyDonor}{" "}
          <Link href="/login" className="font-semibold text-[var(--blood-deep)] underline">
            {t.login}
          </Link>
        </p>
      </form>
    </>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BLOOD_GROUPS, DISTRICTS } from "@/lib/districts";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  RegisterSuccessModal,
  type RegisteredDonorSummary,
} from "@/components/RegisterSuccessModal";

export function RegisterForm() {
  const { t } = useLocale();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
    bloodIssue: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          lastDonationDate: form.lastDonationDate || null,
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

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-5 rounded-2xl bg-white/80 p-6">
        <section className="space-y-3">
          <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--blood-deep)]">
            {t.personalInfo}
          </h3>
          {(
            [
              ["name", t.name],
              ["email", t.email],
              ["phone", t.phone],
              ["password", t.password],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-sm">
              <span className="mb-1 block font-medium">{label}</span>
              <input
                className="field"
                type={
                  key === "password" ? "password" : key === "email" ? "email" : "text"
                }
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={key === "phone" ? "01XXXXXXXXX" : undefined}
                required
              />
              {key === "password" ? (
                <span className="mt-1 block text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                  {t.passwordHint}
                </span>
              ) : null}
            </label>
          ))}
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
                onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
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
            <input
              className="field"
              type="text"
              value={form.area}
              onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
              required
            />
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
          {loading ? t.loading : t.createAccount}
        </button>
        <p className="text-center text-sm">
          {t.alreadyDonor}{" "}
          <Link href="/login" className="font-semibold text-[var(--blood-deep)] underline">
            {t.login}
          </Link>
        </p>
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

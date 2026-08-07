"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";

export function ForgotPasswordForm() {
  const { t } = useLocale();
  const [mode, setMode] = useState<"email" | "phone">("phone");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tempCode, setTempCode] = useState("");
  const [step, setStep] = useState<"request" | "reset">("request");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setTempCode("");
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "email" ? { email } : { phone },
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errorGeneric);
        return;
      }
      if (data.code) {
        setTempCode(data.code);
        setStep("reset");
        setMessage(t.codeSent);
      } else {
        setMessage(data.message || t.codeSent);
      }
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError(t.passwordsMismatch);
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(mode === "email" ? { email } : { phone }),
          code,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errorGeneric);
        return;
      }
      setMessage(t.passwordUpdated);
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
      setTempCode("");
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl bg-white/80 p-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={mode === "phone" ? "btn-primary" : "btn-ghost"}
          onClick={() => {
            setMode("phone");
            setStep("request");
            setTempCode("");
          }}
        >
          {t.usePhone}
        </button>
        <button
          type="button"
          className={mode === "email" ? "btn-primary" : "btn-ghost"}
          onClick={() => {
            setMode("email");
            setStep("request");
            setTempCode("");
          }}
        >
          {t.useEmail}
        </button>
      </div>

      {step === "request" ? (
        <form onSubmit={requestCode} className="space-y-3">
          {mode === "email" ? (
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t.verifyEmail}</span>
              <input
                className="field"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
          ) : (
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t.verifyPhone}</span>
              <input
                className="field"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </label>
          )}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? t.loading : t.sendResetCode}
          </button>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="space-y-3">
          {tempCode ? (
            <p className="rounded-xl bg-[color-mix(in_oklab,var(--blood)_8%,white)] px-3 py-2 text-sm text-[var(--blood-deep)]">
              {t.yourCode}: <strong>{tempCode}</strong>
            </p>
          ) : null}
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t.resetCode}</span>
            <input
              className="field"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t.newPassword}</span>
            <input
              className="field"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t.confirmNewPassword}</span>
            <input
              className="field"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
            />
          </label>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? t.loading : t.resetPassword}
          </button>
          <button
            type="button"
            className="btn-ghost w-full"
            onClick={() => setStep("request")}
          >
            {t.sendResetCode}
          </button>
        </form>
      )}

      {error ? <p className="text-sm text-[var(--blood)]">{error}</p> : null}
      {message ? <p className="text-sm text-[var(--sage)]">{message}</p> : null}

      <p className="text-center text-sm">
        <Link href="/login" className="font-semibold text-[var(--blood-deep)] underline">
          {t.login}
        </Link>
      </p>
    </div>
  );
}

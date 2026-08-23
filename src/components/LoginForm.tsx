"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PasswordField } from "@/components/PasswordField";
import { useLocale } from "@/lib/i18n/locale-context";

type Mode = "login" | "forgot" | "forgot-reset";

export function LoginForm() {
  const { t } = useLocale();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [emailMasked, setEmailMasked] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errorGeneric);
        return;
      }
      router.push("/dashboard");
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  async function sendResetOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setHint("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", email: resetEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errorGeneric);
        return;
      }
      setEmailMasked(data.emailMasked || resetEmail);
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setHint(t.otpSentToEmail);
      setMode("forgot-reset");
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  async function confirmReset(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError(t.forgotPasswordMismatch);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          email: resetEmail.trim().toLowerCase(),
          code: otp,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errorGeneric);
        return;
      }
      router.push("/dashboard");
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  if (mode === "forgot") {
    return (
      <form onSubmit={sendResetOtp} className="space-y-3 rounded-2xl bg-white/80 p-6">
        <p className="text-sm leading-relaxed text-[color-mix(in_oklab,var(--ink)_75%,white)]">
          {t.forgotPasswordHint}
        </p>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t.email}</span>
          <input
            className="field"
            type="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            placeholder="you@gmail.com"
            required
            autoComplete="email"
          />
        </label>
        {error ? <p className="text-sm text-[var(--blood)]">{error}</p> : null}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? t.loading : t.forgotPasswordSendOtp}
        </button>
        <button
          type="button"
          className="w-full text-center text-sm font-semibold text-[var(--blood-deep)] underline"
          onClick={() => {
            setMode("login");
            setError("");
            setHint("");
          }}
        >
          {t.forgotPasswordBackToLogin}
        </button>
      </form>
    );
  }

  if (mode === "forgot-reset") {
    return (
      <form onSubmit={confirmReset} className="space-y-3 rounded-2xl bg-white/80 p-6">
        {hint ? (
          <p className="text-sm text-[color-mix(in_oklab,var(--ink)_70%,white)]">
            {hint}
            {emailMasked ? (
              <span className="mt-1 block font-medium text-[var(--ink)]">{emailMasked}</span>
            ) : null}
          </p>
        ) : null}
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t.forgotPasswordOtpLabel}</span>
          <input
            className="field tracking-[0.35em]"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
          />
        </label>
        <PasswordField
          id="reset-new-password"
          label={t.newPassword}
          value={newPassword}
          onChange={setNewPassword}
          required
          autoComplete="new-password"
          hint={t.passwordHint}
        />
        <PasswordField
          id="reset-confirm-password"
          label={t.forgotPasswordConfirm}
          value={confirmPassword}
          onChange={setConfirmPassword}
          required
          autoComplete="new-password"
        />
        {error ? <p className="text-sm text-[var(--blood)]">{error}</p> : null}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? t.loading : t.forgotPasswordSubmit}
        </button>
        <button
          type="button"
          className="w-full text-center text-sm font-semibold text-[var(--blood-deep)] underline"
          onClick={() => {
            setMode("forgot");
            setError("");
            setHint("");
          }}
        >
          {t.forgotPasswordResendHint}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl bg-white/80 p-6">
      <label className="block text-sm">
        <span className="mb-1 block font-medium">{t.loginIdentifier}</span>
        <input
          className="field"
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.loginIdentifierHint}
          required
          autoComplete="username"
        />
      </label>
      <PasswordField
        id="login-password"
        label={t.password}
        value={password}
        onChange={setPassword}
        required
        autoComplete="current-password"
      />
      {error ? <p className="text-sm text-[var(--blood)]">{error}</p> : null}
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? t.loading : t.login}
      </button>
      <button
        type="button"
        className="w-full text-center text-sm font-semibold text-[var(--blood-deep)] underline"
        onClick={() => {
          setResetEmail(email.includes("@") ? email : "");
          setMode("forgot");
          setError("");
        }}
      >
        {t.forgotPassword}
      </button>
      <p className="text-center text-sm">
        {t.noAccount}{" "}
        <Link href="/register" className="font-semibold text-[var(--blood-deep)] underline">
          {t.becomeDonor}
        </Link>
      </p>
    </form>
  );
}

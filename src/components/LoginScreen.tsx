"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogo3d } from "@/components/BrandLogo3d";
import { useLocale } from "@/lib/i18n/locale-context";
import { markDonorSessionActive } from "@/lib/session-me-client";

type Mode = "login" | "forgot" | "forgot-otp" | "forgot-reset";

type Props = {
  providers: { google: boolean; apple: boolean };
};

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M3.5 7.5 12 13l8.5-5.5" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <rect x="5" y="10" width="14" height="11" rx="3" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <circle cx="12" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <circle cx="8" cy="14" r="4" />
      <path d="M11 11 20 2M16 6l2 2M13 9l2 2" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" {...stroke} strokeWidth={2.4}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" {...stroke} strokeWidth={2.6}>
      <path d="M5 12.5 10 17.5 19 7" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" {...stroke} strokeWidth={2.2}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

function UserPlusIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <circle cx="10" cy="8" r="4" />
      <path d="M3 20c1.3-3.3 4-5 7-5 1.2 0 2.3.2 3.3.7M19 14v6M16 17h6" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M3 3l18 18M10.5 10.7a2.5 2.5 0 003.6 3.4M9.4 5.5A10.5 10.5 0 0121 12c-.7 1.2-1.6 2.3-2.7 3.2M6.2 6.3C4.6 7.6 3.4 9.2 2.5 12c1.8 4.5 6 7.5 9.5 7.5 1.4 0 2.8-.4 4-.1" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M2.5 12C4.3 7.5 8.5 4.5 12 4.5S19.7 7.5 21.5 12C19.7 16.5 15.5 19.5 12 19.5S4.3 16.5 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6.1C12.3 13.5 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.4 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.1.8-4.6l-7.8-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.2 0 11.6-2 15.4-5.6l-7.5-5.8c-2.1 1.4-4.8 2.3-7.9 2.3-6.3 0-11.7-4-13.6-9.8l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M16.7 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.8 3-.8s1.8.8 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.7 0 0-2.5-1-2.5-3.6zM14.5 5.8c.6-.8 1.1-1.9.9-3-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1.1.1 2.1-.5 2.8-1.3z" />
    </svg>
  );
}

function Spinner() {
  return (
    <span className="inline-block h-6 w-6 animate-spin rounded-full border-[3px] border-white/35 border-t-white" />
  );
}

export function LoginScreen({ providers }: Props) {
  const { t, locale, toggleLocale } = useLocale();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [emailMasked, setEmailMasked] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);
  // Google/Apple round-trip failure lands on /login?social_error=<code>.
  const [socialErrorCode, setSocialErrorCode] = useState(() =>
    typeof window === "undefined"
      ? ""
      : new URLSearchParams(window.location.search).get("social_error") || "",
  );

  useEffect(() => {
    if (!socialErrorCode) return;
    window.history.replaceState(null, "", "/login");
  }, [socialErrorCode]);

  const socialError = !socialErrorCode
    ? ""
    : socialErrorCode === "cancelled"
      ? t.socialErrorCancelled
      : socialErrorCode === "unavailable"
        ? t.socialErrorUnavailable
        : t.socialErrorGeneric;
  const shownError = error || (mode === "login" ? socialError : "");

  function goDashboardFresh() {
    markDonorSessionActive();
    window.location.assign("/dashboard");
  }

  async function post(body: Record<string, unknown>, url: string) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data: data as { error?: string; emailMasked?: string } };
  }

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSocialErrorCode("");
    try {
      const { ok, data } = await post({ email, password }, "/api/auth/login");
      if (!ok) {
        setError(data.error || t.errorGeneric);
        return;
      }
      goDashboardFresh();
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
      const { ok, data } = await post(
        { action: "send", email: resetEmail },
        "/api/auth/reset-password",
      );
      if (!ok) {
        setError(data.error || t.errorGeneric);
        return;
      }
      setEmailMasked(data.emailMasked || resetEmail);
      setOtp("");
      setHint(t.otpSentToEmail);
      setMode("forgot-otp");
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  async function verifyResetOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { ok, data } = await post(
        { action: "verify", email: resetEmail.trim().toLowerCase(), code: otp },
        "/api/auth/reset-password",
      );
      if (!ok) {
        setError(data.error || t.errorGeneric);
        return;
      }
      setHint("");
      setNewPassword("");
      setConfirmPassword("");
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
      const { ok, data } = await post(
        { action: "confirm", email: resetEmail.trim().toLowerCase(), newPassword },
        "/api/auth/reset-password",
      );
      if (!ok) {
        setError(data.error || t.errorGeneric);
        return;
      }
      goDashboardFresh();
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  function back() {
    setError("");
    setHint("");
    setMode(mode === "forgot" ? "login" : mode === "forgot-otp" ? "forgot" : "forgot-otp");
  }

  const showSocial = providers.google || providers.apple;

  const form =
    mode === "login" ? (
      <form onSubmit={onLogin} className="space-y-3" aria-label={t.loginTitle}>
        <label className="auth-field">
          <UserIcon />
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.loginIdentifierHint}
            required
            autoComplete="username"
            aria-label={t.loginIdentifier}
          />
        </label>
        <label className="auth-field">
          <LockIcon />
          <input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            aria-label={t.password}
          />
          <button
            type="button"
            className="auth-field__eye"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            <EyeIcon open={showPw} />
          </button>
        </label>
        {shownError ? <p className="px-1 text-sm text-[#ff8a98]">{shownError}</p> : null}
        <button type="submit" className="auth-submit" disabled={loading} aria-label={t.login}>
          {loading ? <Spinner /> : <ArrowIcon />}
        </button>
      </form>
    ) : mode === "forgot" ? (
      <form onSubmit={sendResetOtp} className="space-y-3" aria-label={t.forgotPassword}>
        <label className="auth-field">
          <MailIcon />
          <input
            type="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            placeholder="you@gmail.com"
            required
            autoComplete="email"
            aria-label={t.email}
          />
        </label>
        {error ? <p className="px-1 text-sm text-[#ff8a98]">{error}</p> : null}
        <button type="submit" className="auth-submit" disabled={loading} aria-label={t.forgotPasswordSendOtp}>
          {loading ? <Spinner /> : <ArrowIcon />}
        </button>
      </form>
    ) : mode === "forgot-otp" ? (
      <form onSubmit={verifyResetOtp} className="space-y-3" aria-label={t.forgotPasswordVerifyOtp}>
        {hint ? (
          <p className="px-1 text-center text-xs text-white/70">
            {hint} <span className="font-semibold text-white">{emailMasked}</span>
          </p>
        ) : null}
        <label className="auth-field auth-otp">
          <KeyIcon />
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="••••••"
            required
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label={t.forgotPasswordOtpLabel}
          />
        </label>
        {error ? <p className="px-1 text-sm text-[#ff8a98]">{error}</p> : null}
        <button type="submit" className="auth-submit" disabled={loading} aria-label={t.forgotPasswordVerifyOtp}>
          {loading ? <Spinner /> : <ArrowIcon />}
        </button>
      </form>
    ) : (
      <form onSubmit={confirmReset} className="space-y-3" aria-label={t.forgotPasswordSubmit}>
        <label className="auth-field">
          <LockIcon />
          <input
            type={showNewPw ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t.newPassword}
            required
            minLength={8}
            autoComplete="new-password"
            aria-label={t.newPassword}
          />
          <button
            type="button"
            className="auth-field__eye"
            onClick={() => setShowNewPw((v) => !v)}
            aria-label={showNewPw ? "Hide password" : "Show password"}
          >
            <EyeIcon open={showNewPw} />
          </button>
        </label>
        <label className="auth-field">
          <LockIcon />
          <input
            type={showNewPw ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t.forgotPasswordConfirm}
            required
            minLength={8}
            autoComplete="new-password"
            aria-label={t.forgotPasswordConfirm}
          />
        </label>
        {error ? <p className="px-1 text-sm text-[#ff8a98]">{error}</p> : null}
        <button type="submit" className="auth-submit" disabled={loading} aria-label={t.forgotPasswordSubmit}>
          {loading ? <Spinner /> : <CheckIcon />}
        </button>
      </form>
    );

  return (
    <div className="auth-screen">
      <div className="auth-screen__orb" style={{ width: 360, height: 360, left: "-120px", top: "18%", background: "#9b1b2e" }} />
      <div className="auth-screen__orb" style={{ width: 300, height: 300, right: "-110px", bottom: "8%", background: "#e6273c" }} />

      <div className="relative z-10 flex w-full max-w-md items-center justify-between px-5 pt-5">
        {mode === "login" ? (
          <Link href="/" className="auth-icon-btn" aria-label={t.loginBackHome} title={t.loginBackHome}>
            <BackIcon />
          </Link>
        ) : (
          <button type="button" className="auth-icon-btn" onClick={back} aria-label={t.otpBack} title={t.otpBack}>
            <BackIcon />
          </button>
        )}
        <button
          type="button"
          onClick={toggleLocale}
          className="auth-icon-btn w-auto px-3 text-xs font-bold tracking-wide"
          aria-label="Toggle language"
        >
          {locale === "bn" ? "EN" : "বাং"}
        </button>
      </div>

      <div className="relative z-10 mt-4 flex w-full flex-1 flex-col items-center px-5 pb-10">
        <div className="mb-6 mt-2 sm:mt-6">
          <div className="auth-logo">
            <BrandLogo3d idPrefix="login" />
          </div>
          <div className="auth-logo__floor" />
        </div>

        <div className="auth-card">
          {form}
          {mode === "login" && showSocial ? (
            <div className="mt-5 flex items-center justify-center gap-3">
              <span className="h-px flex-1 bg-white/10" />
              {providers.google ? (
                <a
                  href="/api/auth/social/google/start"
                  className="auth-social"
                  aria-label="Continue with Google"
                  title="Google"
                >
                  <GoogleIcon />
                </a>
              ) : null}
              {providers.apple ? (
                <a
                  href="/api/auth/social/apple/start"
                  className="auth-social"
                  aria-label="Continue with Apple"
                  title="Apple"
                >
                  <AppleIcon />
                </a>
              ) : null}
              <span className="h-px flex-1 bg-white/10" />
            </div>
          ) : null}
        </div>

        {mode === "login" ? (
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              type="button"
              className="auth-chip"
              onClick={() => {
                setResetEmail(email.includes("@") ? email : "");
                setMode("forgot");
                setError("");
              }}
            >
              <KeyIcon />
              <span>{t.loginForgotShort}</span>
            </button>
            <Link href="/register" className="auth-chip">
              <UserPlusIcon />
              <span>{t.loginNewShort}</span>
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

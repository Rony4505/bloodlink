"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FashionButton } from "@/components/fashion/FashionButton";
import { FashionShell } from "@/components/fashion/FashionShell";
import { fashionLightSurfaceClass } from "@/lib/fashion/locale-text-style";
import { PasswordField } from "@/components/fashion/PasswordField";
import { copy } from "@/lib/fashion/copy";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot" | "forgot-otp" | "forgot-reset">("login");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [targetHint, setTargetHint] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/fashion/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", email, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "লগইন ব্যর্থ");
      return;
    }

    router.push("/account");
    router.refresh();
  }

  async function sendForgotOtp(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/fashion/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "forgot-send-otp",
        email,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "OTP পাঠানো যায়নি");
      return;
    }
    setResetEmail(data.email || email);
    setTargetHint(data.targetHint || email);
    setOtp("");
    setMode("forgot-otp");
  }

  async function verifyForgotOtp(event: FormEvent) {
    event.preventDefault();
    if (!otp.trim()) {
      setError("Gmail-এ পাঠানো OTP কোডটি লিখুন");
      return;
    }
    setError("");
    setMode("forgot-reset");
  }

  async function resetPassword(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/fashion/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "forgot-reset",
        email: resetEmail,
        channel: "email",
        code: otp,
        newPassword,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "রিসেট ব্যর্থ");
      return;
    }
    router.push("/account");
    router.refresh();
  }

  return (
    <FashionShell>
      <section className="mx-auto max-w-md px-5 py-20 text-[#e8eef7] md:px-8">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold text-white">
          {mode === "login" ? copy.account.loginTitle : "পাসওয়ার্ড রিসেট"}
        </h1>
        {mode === "login" ? (
          <p className="mt-2 text-sm text-[#b8c9de]">
            আপনার ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন।
          </p>
        ) : null}

        {mode === "login" ? (
          <form
            onSubmit={handleSubmit}
            className={`mt-8 space-y-4 rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_24px_80px_rgba(48,27,20,0.06)] ${fashionLightSurfaceClass}`}
          >
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            <label className="block">
              <span className="text-sm text-[#9b7766]">Gmail / ইমেইল</span>
              <input
                className="field mt-2"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </label>
            <PasswordField
              label={copy.form.password}
              value={password}
              onChange={setPassword}
              required
            />
            <FashionButton type="submit" disabled={loading}>
              {loading ? "লগইন হচ্ছে..." : copy.nav.login}
            </FashionButton>
            <button
              type="button"
              className="text-sm font-semibold text-[#8f624e]"
              onClick={() => {
                setMode("forgot");
                setError("");
              }}
            >
              পাসওয়ার্ড ভুলে গেছেন?
            </button>
          </form>
        ) : null}

        {mode === "forgot" ? (
          <form
            onSubmit={sendForgotOtp}
            className={`mt-8 space-y-4 rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_24px_80px_rgba(48,27,20,0.06)] ${fashionLightSurfaceClass}`}
          >
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            <p className="text-sm text-[#6f554a]">
              রেজিস্টার করা Gmail / ইমেইলে OTP পাঠানো হবে — নতুন পাসওয়ার্ড সেট করুন।
            </p>
            <label className="block">
              <span className="text-sm text-[#9b7766]">Gmail / ইমেইল</span>
              <input
                className="field mt-2"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </label>
            <FashionButton type="submit" disabled={loading}>
              {loading ? "OTP পাঠানো হচ্ছে..." : "Gmail-এ OTP পাঠান"}
            </FashionButton>
            <button
              type="button"
              className="text-sm font-semibold text-[#8f624e]"
              onClick={() => setMode("login")}
            >
              ← লগইনে ফিরে যান
            </button>
          </form>
        ) : null}

        {mode === "forgot-otp" ? (
          <form
            onSubmit={verifyForgotOtp}
            className={`mt-8 space-y-4 rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_24px_80px_rgba(48,27,20,0.06)] ${fashionLightSurfaceClass}`}
          >
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            <p className="text-sm text-[#6f554a]">
              OTP পাঠানো হয়েছে{targetHint ? ` (${targetHint})` : ""}। Gmail ইনবক্স চেক করুন।
            </p>
            <label className="block">
              <span className="text-sm text-[#9b7766]">OTP কোড</span>
              <input
                className="field mt-2 tracking-[0.35em]"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
              />
            </label>
            <FashionButton type="submit">পরবর্তী</FashionButton>
          </form>
        ) : null}

        {mode === "forgot-reset" ? (
          <form
            onSubmit={resetPassword}
            className={`mt-8 space-y-4 rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_24px_80px_rgba(48,27,20,0.06)] ${fashionLightSurfaceClass}`}
          >
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            <PasswordField
              label="নতুন পাসওয়ার্ড"
              value={newPassword}
              onChange={setNewPassword}
              required
            />
            <FashionButton type="submit" disabled={loading}>
              {loading ? "সেভ হচ্ছে..." : "পাসওয়ার্ড সেট করুন"}
            </FashionButton>
          </form>
        ) : null}

        {mode === "login" ? (
          <div
            className={`mt-6 overflow-hidden rounded-[2rem] border border-[#e8d4c4]/35 bg-[linear-gradient(145deg,rgba(255,255,255,0.14),rgba(255,255,255,0.06))] p-6 shadow-[0_20px_60px_rgba(10,22,40,0.25)] backdrop-blur-sm`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c9a890]">
              নতুন ইউজার?
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-white">
              অ্যাকাউন্ট তৈরি করুন
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#c5d4e8]">
              Gmail OTP দিয়ে নিরাপদ রেজিস্ট্রেশন — অর্ডার ট্র্যাক ও নোটিফিকেশন পান।
            </p>
            <Link
              href="/account/register"
              className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#c9a890,#8f624e)] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(143,98,78,0.35)] transition hover:brightness-110"
            >
              রেজিস্টার করুন →
            </Link>
          </div>
        ) : null}
      </section>
    </FashionShell>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const [targetHint, setTargetHint] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendOtp(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/fashion/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register-send-otp", ...form, channel: "email" }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "OTP পাঠানো যায়নি");
      return;
    }
    setTargetHint(data.targetHint || form.email);
    setOtp("");
    setStep("otp");
  }

  async function verifyOtp(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/fashion/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "register-verify",
        email: form.email,
        code: otp,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "ভেরিফিকেশন ব্যর্থ");
      return;
    }
    router.push("/account");
    router.refresh();
  }

  return (
    <FashionShell>
      <section className="mx-auto max-w-md px-5 py-20 text-[#e8eef7] md:px-8">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold text-white">
          {copy.account.registerTitle}
        </h1>
        <p className="mt-2 text-sm text-[#b8c9de]">
          শুধু Gmail / ইমেইল OTP দিয়ে অ্যাকাউন্ট ভেরিফাই হয়।
        </p>

        {step === "form" ? (
          <form
            onSubmit={sendOtp}
            className={`mt-8 space-y-4 rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_24px_80px_rgba(48,27,20,0.06)] ${fashionLightSurfaceClass}`}
          >
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            {(
              [
                ["name", copy.form.name, "text"],
                ["email", "Gmail / ইমেইল", "email"],
                ["phone", "ফোন নম্বর", "tel"],
              ] as const
            ).map(([key, label, type]) => (
              <label key={key} className="block">
                <span className="text-sm text-[#9b7766]">{label}</span>
                <input
                  className="field mt-2"
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm((c) => ({ ...c, [key]: e.target.value }))}
                  required
                  autoComplete={key === "email" ? "email" : key === "name" ? "name" : "tel"}
                />
              </label>
            ))}
            <PasswordField
              label={copy.form.password}
              value={form.password}
              onChange={(v) => setForm((c) => ({ ...c, password: v }))}
              required
            />
            <p className="rounded-xl bg-[#faf4f0] px-3 py-2 text-xs text-[#6f554a]">
              OTP আপনার Gmail / ইমেইলে পাঠানো হবে — ফোন OTP আর ব্যবহার হয় না।
            </p>
            <FashionButton type="submit" disabled={loading}>
              {loading ? "OTP পাঠানো হচ্ছে..." : "Gmail-এ OTP পাঠান"}
            </FashionButton>
          </form>
        ) : (
          <form
            onSubmit={verifyOtp}
            className={`mt-8 space-y-4 rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_24px_80px_rgba(48,27,20,0.06)] ${fashionLightSurfaceClass}`}
          >
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            <p className="text-sm text-[#6f554a]">
              {targetHint || "আপনার ইমেইল"}-এ OTP পাঠানো হয়েছে। Gmail ইনবক্স (ও Spam) চেক করুন।
            </p>
            <label className="block">
              <span className="text-sm text-[#9b7766]">OTP কোড</span>
              <input
                className="field mt-2 tracking-[0.35em]"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
              />
            </label>
            <FashionButton type="submit" disabled={loading}>
              {loading ? "যাচাই হচ্ছে..." : "অ্যাকাউন্ট তৈরি করুন"}
            </FashionButton>
            <button
              type="button"
              className="text-sm font-semibold text-[#8f624e]"
              onClick={() => setStep("form")}
            >
              ← ফর্মে ফিরে যান
            </button>
          </form>
        )}

        <p className="mt-4 text-sm text-[#b8c9de]">
          ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
          <Link href="/account/login" className="font-semibold text-[#f0c9a8] underline">
            লগইন করুন
          </Link>
        </p>
      </section>
    </FashionShell>
  );
}

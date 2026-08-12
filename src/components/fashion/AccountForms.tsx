"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FashionButton } from "@/components/fashion/FashionButton";
import { FashionShell } from "@/components/fashion/FashionShell";
import { PasswordField } from "@/components/fashion/PasswordField";
import { copy } from "@/lib/fashion/copy";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot" | "forgot-otp" | "forgot-reset">("login");
  const [channel, setChannel] = useState<"email" | "phone">("email");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [debugOtp, setDebugOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");

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
        phone,
        channel,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "OTP পাঠানো যায়নি");
      return;
    }
    setResetEmail(data.email || email);
    setDebugOtp(data.debugOtp || "");
    setOtp(String(data.debugOtp || ""));
    setMode("forgot-otp");
  }

  async function verifyForgotOtp(event: FormEvent) {
    event.preventDefault();
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
        channel,
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
      <section className="mx-auto max-w-md px-5 py-20 md:px-8">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">
          {mode === "login" ? copy.account.loginTitle : "পাসওয়ার্ড রিসেট"}
        </h1>

        {mode === "login" ? (
          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-4 rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_24px_80px_rgba(48,27,20,0.06)]"
          >
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            <label className="block">
              <span className="text-sm text-[#9b7766]">ইমেইল</span>
              <input
                className="field mt-2"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
            className="mt-8 space-y-4 rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_24px_80px_rgba(48,27,20,0.06)]"
          >
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            <p className="text-sm text-[#6f554a]">
              রেজিস্টার করা ইমেইল বা ফোন দিয়ে OTP পাঠান — নতুন পাসওয়ার্ড সেট করুন।
            </p>
            <label className="block">
              <span className="text-sm text-[#9b7766]">ইমেইল</span>
              <input
                className="field mt-2"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required={channel === "email"}
              />
            </label>
            <label className="block">
              <span className="text-sm text-[#9b7766]">ফোন (ঐচ্ছিক)</span>
              <input
                className="field mt-2"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required={channel === "phone"}
              />
            </label>
            <div>
              <p className="mb-2 text-sm text-[#9b7766]">OTP কোথায় পাঠাবেন?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setChannel("email")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    channel === "email"
                      ? "bg-[#8f624e] text-white"
                      : "border border-[#c9a890] bg-[#f3ebe4] text-[#1c1412]"
                  }`}
                >
                  Gmail
                </button>
                <button
                  type="button"
                  onClick={() => setChannel("phone")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    channel === "phone"
                      ? "bg-[#8f624e] text-white"
                      : "border border-[#c9a890] bg-[#f3ebe4] text-[#1c1412]"
                  }`}
                >
                  Phone
                </button>
              </div>
            </div>
            <FashionButton type="submit" disabled={loading}>
              {loading ? "OTP পাঠানো হচ্ছে..." : "OTP পাঠান"}
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
            className="mt-8 space-y-4 rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_24px_80px_rgba(48,27,20,0.06)]"
          >
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            {debugOtp ? (
              <p className="rounded-xl border border-[#e8cc80] bg-[#fffbf0] px-4 py-3 text-center text-lg font-bold tracking-[0.35em] text-[#6b5420]">
                {debugOtp}
              </p>
            ) : null}
            <label className="block">
              <span className="text-sm text-[#9b7766]">OTP কোড</span>
              <input
                className="field mt-2 tracking-[0.35em]"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                inputMode="numeric"
              />
            </label>
            <FashionButton type="submit">পরবর্তী</FashionButton>
          </form>
        ) : null}

        {mode === "forgot-reset" ? (
          <form
            onSubmit={resetPassword}
            className="mt-8 space-y-4 rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_24px_80px_rgba(48,27,20,0.06)]"
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
          <p className="mt-4 text-sm text-[#6f554a]">
            অ্যাকাউন্ট নেই?{" "}
            <Link href="/account/register" className="font-semibold underline">
              রেজিস্টার করুন
            </Link>
          </p>
        ) : null}
      </section>
    </FashionShell>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [channel, setChannel] = useState<"email" | "phone">("email");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const [debugOtp, setDebugOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendOtp(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/fashion/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register-send-otp", ...form, channel }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "OTP পাঠানো যায়নি");
      return;
    }
    setDebugOtp(data.debugOtp || "");
    setOtp(String(data.debugOtp || ""));
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
      <section className="mx-auto max-w-md px-5 py-20 md:px-8">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">
          {copy.account.registerTitle}
        </h1>

        {step === "form" ? (
          <form
            onSubmit={sendOtp}
            className="mt-8 space-y-4 rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_24px_80px_rgba(48,27,20,0.06)]"
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
                />
              </label>
            ))}
            <PasswordField
              label={copy.form.password}
              value={form.password}
              onChange={(v) => setForm((c) => ({ ...c, password: v }))}
              required
            />
            <div>
              <p className="mb-2 text-sm text-[#9b7766]">OTP পাঠাবেন কোথায়?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setChannel("email")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    channel === "email"
                      ? "bg-[#8f624e] text-white"
                      : "border border-[#c9a890] bg-[#f3ebe4] text-[#1c1412]"
                  }`}
                >
                  Gmail / Email
                </button>
                <button
                  type="button"
                  onClick={() => setChannel("phone")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    channel === "phone"
                      ? "bg-[#8f624e] text-white"
                      : "border border-[#c9a890] bg-[#f3ebe4] text-[#1c1412]"
                  }`}
                >
                  Phone
                </button>
              </div>
            </div>
            <FashionButton type="submit" disabled={loading}>
              {loading ? "OTP পাঠানো হচ্ছে..." : "OTP পাঠান ও ভেরিফাই"}
            </FashionButton>
          </form>
        ) : (
          <form
            onSubmit={verifyOtp}
            className="mt-8 space-y-4 rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_24px_80px_rgba(48,27,20,0.06)]"
          >
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            <p className="text-sm text-[#6f554a]">
              {channel === "email" ? "ইমেইল" : "ফোন"}-এ OTP পাঠানো হয়েছে। কোডটি লিখুন।
            </p>
            {debugOtp ? (
              <p className="rounded-xl border border-[#e8cc80] bg-[#fffbf0] px-4 py-3 text-center text-lg font-bold tracking-[0.35em] text-[#6b5420]">
                {debugOtp}
              </p>
            ) : null}
            <p className="text-xs text-[#9b7766]">উপরের OTP কোডটি নিচে লিখুন</p>
            <label className="block">
              <span className="text-sm text-[#9b7766]">OTP কোড</span>
              <input
                className="field mt-2 tracking-[0.35em]"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                inputMode="numeric"
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

        <p className="mt-4 text-sm text-[#6f554a]">
          ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
          <Link href="/account/login" className="font-semibold underline">
            লগইন করুন
          </Link>
        </p>
      </section>
    </FashionShell>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FashionButton } from "@/components/fashion/FashionButton";
import { FashionShell } from "@/components/fashion/FashionShell";
import { copy } from "@/lib/fashion/copy";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <FashionShell>
      <section className="mx-auto max-w-md px-5 py-20 md:px-8">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">
          {copy.account.loginTitle}
        </h1>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_24px_80px_rgba(48,27,20,0.06)]">
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <label className="block">
            <span className="text-sm text-[#9b7766]">ইমেইল</span>
            <input className="field mt-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="block">
            <span className="text-sm text-[#9b7766]">{copy.form.password}</span>
            <input className="field mt-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <FashionButton type="submit" disabled={loading}>{loading ? "লগইন হচ্ছে..." : copy.nav.login}</FashionButton>
        </form>
        <p className="mt-4 text-sm text-[#6f554a]">
          অ্যাকাউন্ট নেই? <Link href="/account/register" className="font-semibold underline">রেজিস্টার করুন</Link>
        </p>
      </section>
    </FashionShell>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/fashion/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register", ...form }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "রেজিস্টার ব্যর্থ");
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
        <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_24px_80px_rgba(48,27,20,0.06)]">
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          {[
            ["name", copy.form.name],
            ["email", "ইমেইল"],
            ["phone", copy.form.phone],
            ["password", copy.form.password],
          ].map(([key, label]) => (
            <label key={key} className="block">
              <span className="text-sm text-[#9b7766]">{label}</span>
              <input
                className="field mt-2"
                type={key === "password" ? "password" : key === "email" ? "email" : "text"}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))}
                required
              />
            </label>
          ))}
          <FashionButton type="submit" disabled={loading}>{loading ? "তৈরি হচ্ছে..." : "অ্যাকাউন্ট তৈরি করুন"}</FashionButton>
        </form>
        <p className="mt-4 text-sm text-[#6f554a]">
          ইতিমধ্যে অ্যাকাউন্ট আছে? <Link href="/account/login" className="font-semibold underline">লগইন করুন</Link>
        </p>
      </section>
    </FashionShell>
  );
}

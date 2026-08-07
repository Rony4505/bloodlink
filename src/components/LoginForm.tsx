"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";

export function LoginForm() {
  const { t } = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl bg-white/80 p-6">
      <label className="block text-sm">
        <span className="mb-1 block font-medium">{t.email}</span>
        <input
          className="field"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">{t.password}</span>
        <input
          className="field"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      {error ? <p className="text-sm text-[var(--blood)]">{error}</p> : null}
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? t.loading : t.login}
      </button>
      <p className="text-center text-sm">
        <Link
          href="/forgot-password"
          className="font-semibold text-[var(--blood-deep)] underline"
        >
          {t.forgotPassword}
        </Link>
      </p>
      <p className="text-center text-sm">
        {t.noAccount}{" "}
        <Link href="/register" className="font-semibold text-[var(--blood-deep)] underline">
          {t.becomeDonor}
        </Link>
      </p>
    </form>
  );
}

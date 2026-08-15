"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PasswordField } from "@/components/PasswordField";
import { useLocale } from "@/lib/i18n/locale-context";

export function VolunteerLoginForm() {
  const { t } = useLocale();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/volunteer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errorGeneric);
        return;
      }
      router.replace("/volunteer");
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-white/80 p-6">
      <p className="rounded-xl border border-[color-mix(in_oklab,#2f6b4f_25%,white)] bg-[color-mix(in_oklab,#2f6b4f_8%,white)] px-3 py-2 text-xs text-[#245a40]">
        {t.volunteerLoginHint}
      </p>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">{t.volunteerUsername}</span>
        <input
          className="field"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
      </label>
      <PasswordField
        id="volunteer-password"
        label={t.password}
        value={password}
        onChange={setPassword}
        required
        autoComplete="current-password"
      />
      {error ? <p className="text-sm text-[var(--blood)]">{error}</p> : null}
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? t.loading : t.volunteerLogin}
      </button>
      <p className="text-center text-sm">
        <Link href="/" className="font-semibold text-[var(--blood-deep)] underline">
          {t.brand}
        </Link>
      </p>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";

export function SuccessStoryForm() {
  const { t } = useLocale();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [quote, setQuote] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOk(false);
    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, handle, quote }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errorGeneric);
        return;
      }
      setOk(true);
      setName("");
      setHandle("");
      setQuote("");
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="border-t border-[var(--line)] pt-8">
      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--blood-deep)]">
        {t.storyFormTitle}
      </h3>
      <p className="mt-1 text-sm text-[color-mix(in_oklab,var(--ink)_70%,white)]">
        {t.storyFormSubtitle}
      </p>
      <form onSubmit={onSubmit} className="mt-4 max-w-xl space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t.storyFormName}</span>
          <input
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">
            {t.storyFormHandle}{" "}
            <span className="font-normal text-[color-mix(in_oklab,var(--ink)_55%,white)]">
              ({t.emailOptional})
            </span>
          </span>
          <input
            className="field"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@name"
            maxLength={60}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t.storyFormQuote}</span>
          <textarea
            className="field min-h-28"
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            required
            minLength={20}
            maxLength={800}
            placeholder={t.storyFormQuoteHint}
          />
        </label>
        {error ? <p className="text-sm text-[var(--blood)]">{error}</p> : null}
        {ok ? (
          <p className="text-sm text-[#245a40]">{t.storyFormSuccess}</p>
        ) : null}
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-[var(--blood-deep)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-55"
          disabled={loading}
        >
          {loading ? t.loading : t.storyFormSubmit}
        </button>
      </form>
    </section>
  );
}

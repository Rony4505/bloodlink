"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";

type Props = {
  donorId: string;
  donorName: string;
  onClose: () => void;
};

export function ContactModal({ donorId, donorName, onClose }: Props) {
  const { t } = useLocale();
  const [seekerName, setSeekerName] = useState("");
  const [seekerPhone, setSeekerPhone] = useState("");
  const [hospital, setHospital] = useState("");
  const [phone, setPhone] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!seekerName || !seekerPhone || !hospital) {
      setError(t.allFields);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/donors/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorId,
          seekerName,
          seekerPhone,
          hospital,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errorGeneric);
        return;
      }
      setPhone(data.phone);
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl bg-[var(--mist)] p-6 shadow-2xl"
      >
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--blood-deep)]">
          {t.contactModalTitle}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[color-mix(in_oklab,var(--ink)_70%,white)]">
          {t.contactModalBody}
        </p>
        <p className="mt-3 text-sm font-semibold">{donorName}</p>

        {phone ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                {t.contactRevealed}
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tracking-wide">
                {phone}
              </p>
            </div>
            <a href={`tel:${phone}`} className="btn-primary w-full">
              {t.callNow}
            </a>
            <button type="button" className="btn-ghost w-full" onClick={onClose}>
              {t.close}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t.seekerName}</span>
              <input
                className="field"
                value={seekerName}
                onChange={(e) => setSeekerName(e.target.value)}
                required
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t.seekerPhone}</span>
              <input
                className="field"
                value={seekerPhone}
                onChange={(e) => setSeekerPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                required
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t.hospital}</span>
              <input
                className="field"
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
                required
              />
            </label>
            {error ? <p className="text-sm text-[var(--blood)]">{error}</p> : null}
            <div className="flex gap-2 pt-2">
              <button type="button" className="btn-ghost flex-1" onClick={onClose}>
                {t.close}
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={loading}>
                {loading ? t.loading : t.submitRequest}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

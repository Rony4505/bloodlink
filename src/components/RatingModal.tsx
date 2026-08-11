"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";

type Props = {
  donorId: string;
  donorName: string;
  onClose: () => void;
};

export function RatingModal({ donorId, donorName, onClose }: Props) {
  const { t } = useLocale();
  const [seekerName, setSeekerName] = useState("");
  const [seekerPhone, setSeekerPhone] = useState("");
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorId,
          seekerName,
          seekerPhone,
          stars,
          comment,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errorGeneric);
        return;
      }
      setDone(true);
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-[var(--mist)] p-6 shadow-2xl">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--blood-deep)]">
          {t.rateDonor}
        </h2>
        <p className="mt-2 text-sm font-semibold">{donorName}</p>
        {done ? (
          <div className="mt-6 space-y-3">
            <p className="text-[var(--sage)]">{t.saved}</p>
            <button type="button" className="btn-primary w-full" onClick={onClose}>
              {t.close}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-3">
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
                required
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t.stars}</span>
              <select
                className="field"
                value={stars}
                onChange={(e) => setStars(Number(e.target.value))}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t.comment}</span>
              <textarea
                className="field min-h-24"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </label>
            {error ? <p className="text-sm text-[var(--blood)]">{error}</p> : null}
            <div className="flex gap-2">
              <button type="button" className="btn-ghost flex-1" onClick={onClose}>
                {t.close}
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={loading}>
                {loading ? t.loading : t.submitRating}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

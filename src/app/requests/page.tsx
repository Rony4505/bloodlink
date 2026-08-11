"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { BLOOD_GROUPS, DISTRICTS } from "@/lib/districts";
import { useLocale } from "@/lib/i18n/locale-context";

type Post = {
  id: string;
  posterName: string;
  patientName: string;
  relation: string;
  bloodGroup: string;
  unitsNeeded: number;
  district: string;
  area: string;
  hospital: string;
  neededBy: string;
  message: string;
  createdAt: string;
  phoneMasked: string;
};

const emptyForm = {
  posterName: "",
  posterPhone: "",
  patientName: "",
  relation: "",
  bloodGroup: "O+",
  unitsNeeded: 1,
  district: "Dhaka",
  area: "",
  hospital: "",
  neededBy: "",
  message: "",
};

export default function RequestsPage() {
  const { t } = useLocale();
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    const res = await fetch("/api/posts");
    const data = await res.json();
    setPosts(data.posts || []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errorGeneric);
        return;
      }
      setForm(emptyForm);
      await load();
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell title={t.requestsTitle} subtitle={t.requestsSubtitle} bannerPage="requests">
      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={submit} className="space-y-3 rounded-2xl bg-white/80 p-6">
          <p className="rounded-xl bg-[color-mix(in_oklab,var(--sand)_50%,white)] px-3 py-2 text-xs leading-relaxed">
            {t.formGuide}
          </p>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t.posterName}</span>
            <input
              className="field"
              value={form.posterName}
              onChange={(e) => setForm({ ...form, posterName: e.target.value })}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t.phone}</span>
            <input
              className="field"
              value={form.posterPhone}
              onChange={(e) => setForm({ ...form, posterPhone: e.target.value })}
              placeholder="01XXXXXXXXX"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t.patientName}</span>
            <input
              className="field"
              value={form.patientName}
              onChange={(e) => setForm({ ...form, patientName: e.target.value })}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t.relation}</span>
            <input
              className="field"
              value={form.relation}
              onChange={(e) => setForm({ ...form, relation: e.target.value })}
              placeholder="Father / Mother / Friend..."
              required
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t.bloodGroup}</span>
              <select
                className="field"
                value={form.bloodGroup}
                onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
              >
                {BLOOD_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t.unitsNeeded}</span>
              <input
                className="field"
                type="number"
                min={1}
                max={20}
                value={form.unitsNeeded}
                onChange={(e) =>
                  setForm({ ...form, unitsNeeded: Number(e.target.value) })
                }
                required
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t.district}</span>
            <select
              className="field"
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
            >
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t.area}</span>
            <input
              className="field"
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t.hospital}</span>
            <input
              className="field"
              value={form.hospital}
              onChange={(e) => setForm({ ...form, hospital: e.target.value })}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t.neededBy}</span>
            <input
              className="field"
              type="date"
              value={form.neededBy}
              onChange={(e) => setForm({ ...form, neededBy: e.target.value })}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t.message}</span>
            <textarea
              className="field min-h-24"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
            />
          </label>
          {error ? <p className="text-sm text-[var(--blood)]">{error}</p> : null}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? t.loading : t.postNeed}
          </button>
        </form>

        <div className="space-y-3 rounded-2xl bg-white/80 p-6">
          {!posts.length ? (
            <p className="text-sm text-[color-mix(in_oklab,var(--ink)_60%,white)]">
              {t.noPosts}
            </p>
          ) : (
            posts.map((p) => (
              <article key={p.id} className="border-b border-[var(--line)] pb-3">
                <p className="font-semibold">
                  {p.bloodGroup} · {p.unitsNeeded} bag · {p.district}
                </p>
                <p className="mt-1 text-sm">
                  {p.patientName} · {p.hospital}, {p.area}
                </p>
                <p className="mt-1 text-sm">{p.message}</p>
                <p className="mt-1 text-xs text-[color-mix(in_oklab,var(--ink)_60%,white)]">
                  {t.neededBy}: {p.neededBy} · {p.phoneMasked}
                </p>
                <Link
                  href={`/requests/${p.id}`}
                  className="mt-2 inline-flex text-sm font-semibold text-[var(--blood-deep)] underline"
                >
                  {t.viewDetails}
                </Link>
              </article>
            ))
          )}
        </div>
      </div>
    </PageShell>
  );
}

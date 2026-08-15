"use client";

import { useEffect, useState } from "react";
import { areasForDistrict } from "@/lib/district-areas";
import { BLOOD_GROUPS, DISTRICTS } from "@/lib/districts";
import { useLocale } from "@/lib/i18n/locale-context";

type VolunteerDonor = {
  id: string;
  name: string;
  phone: string;
  bloodGroup: string;
  district: string;
  area: string;
  gender: string;
  donationCount: number;
  createdAt: string;
};

export function VolunteerDonorPanel() {
  const { t } = useLocale();
  const [donors, setDonors] = useState<VolunteerDonor[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    gender: "male",
    bloodGroup: "O+",
    district: "Dhaka",
    area: "",
    lastDonationDate: "",
    donationCount: 0,
    tempPassword: "",
  });

  const areaOptions = areasForDistrict(form.district);

  async function load() {
    const res = await fetch("/api/volunteer/donors");
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || t.errorGeneric);
      return;
    }
    const data = await res.json();
    setDonors(data.donors || []);
    setError("");
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/volunteer/donors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          lastDonationDate: form.lastDonationDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errorGeneric);
        return;
      }
      setMessage(t.volunteerDonorAdded);
      setForm({
        name: "",
        phone: "",
        gender: "male",
        bloodGroup: "O+",
        district: form.district,
        area: "",
        lastDonationDate: "",
        donationCount: 0,
        tempPassword: "",
      });
      await load();
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  async function saveEdit(id: string) {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/volunteer/donors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: editName, phone: editPhone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errorGeneric);
        return;
      }
      setEditingId(null);
      setMessage(t.volunteerDonorUpdated);
      await load();
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-[color-mix(in_oklab,#2f6b4f_30%,white)] bg-white/90 p-5">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--blood-deep)]">
          {t.volunteerDonorModuleTitle}
        </h2>
        <p className="mt-1 text-sm text-[color-mix(in_oklab,var(--ink)_70%,white)]">
          {t.volunteerDonorModuleHint}
        </p>
      </div>

      <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block font-medium">{t.name}</span>
          <input
            className="field"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t.phone}</span>
          <input
            className="field"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="01XXXXXXXXX"
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t.volunteerDonorTempPassword}</span>
          <input
            className="field"
            type="text"
            value={form.tempPassword}
            onChange={(e) =>
              setForm((f) => ({ ...f, tempPassword: e.target.value }))
            }
            required
            minLength={8}
            autoComplete="off"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t.gender}</span>
          <select
            className="field"
            value={form.gender}
            onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
          >
            <option value="male">{t.male}</option>
            <option value="female">{t.female}</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t.bloodGroup}</span>
          <select
            className="field"
            value={form.bloodGroup}
            onChange={(e) =>
              setForm((f) => ({ ...f, bloodGroup: e.target.value }))
            }
          >
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t.district}</span>
          <select
            className="field"
            value={form.district}
            onChange={(e) => {
              const district = e.target.value;
              const areas = areasForDistrict(district);
              setForm((f) => ({
                ...f,
                district,
                area: areas.includes(f.area) ? f.area : "",
              }));
            }}
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
          <select
            className="field"
            value={form.area}
            onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
            required
          >
            <option value="">{t.selectArea}</option>
            {areaOptions.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t.lastDonation}</span>
          <input
            className="field"
            type="date"
            value={form.lastDonationDate}
            onChange={(e) =>
              setForm((f) => ({ ...f, lastDonationDate: e.target.value }))
            }
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t.donationCountField}</span>
          <input
            className="field"
            type="number"
            min={0}
            max={500}
            value={form.donationCount}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                donationCount: Number(e.target.value) || 0,
              }))
            }
          />
        </label>
        <p className="text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)] sm:col-span-2">
          {t.volunteerDonorTempPasswordHint}
        </p>
        <button
          type="submit"
          className="btn-primary sm:col-span-2"
          disabled={loading}
        >
          {loading ? t.loading : t.volunteerDonorAdd}
        </button>
      </form>

      {error ? <p className="text-sm text-[var(--blood)]">{error}</p> : null}
      {message ? <p className="text-sm text-[#245a40]">{message}</p> : null}

      <div>
        <h3 className="font-semibold">{t.volunteerMyDonors}</h3>
        {!donors.length ? (
          <p className="mt-2 text-sm text-[color-mix(in_oklab,var(--ink)_60%,white)]">
            {t.volunteerNoDonorsYet}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {donors.map((d) => (
              <li
                key={d.id}
                className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm"
              >
                {editingId === d.id ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      className="field"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                    <input
                      className="field"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                    />
                    <div className="flex gap-2 sm:col-span-2">
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={loading}
                        onClick={() => void saveEdit(d.id)}
                      >
                        {t.saveChanges}
                      </button>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => setEditingId(null)}
                      >
                        {t.otpBack}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">
                        {d.name} · {d.bloodGroup} · {d.phone}
                      </p>
                      <p className="text-xs opacity-70">
                        {d.area}, {d.district}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-ghost text-xs"
                      onClick={() => {
                        setEditingId(d.id);
                        setEditName(d.name);
                        setEditPhone(d.phone);
                      }}
                    >
                      {t.volunteerEditNamePhone}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DonorResults } from "@/components/DonorResults";
import { BLOOD_GROUPS, DISTRICTS } from "@/lib/districts";
import { useLocale } from "@/lib/i18n/locale-context";
import type { PublicDonor } from "@/lib/types";

export function SearchPanel() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const [bloodGroup, setBloodGroup] = useState("");
  const [district, setDistrict] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [donors, setDonors] = useState<PublicDonor[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");

  async function runSearch(next?: {
    bloodGroup?: string;
    district?: string;
    availableOnly?: boolean;
  }) {
    setLoading(true);
    setError("");
    const bg = next?.bloodGroup ?? bloodGroup;
    const dist = next?.district ?? district;
    const avail = next?.availableOnly ?? availableOnly;
    const params = new URLSearchParams();
    if (bg) params.set("bloodGroup", bg);
    if (dist) params.set("district", dist);
    if (avail) params.set("availableOnly", "true");
    try {
      const res = await fetch(`/api/donors?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errorGeneric);
        setDonors([]);
        return;
      }
      setDonors(data.donors || []);
    } catch {
      setError(t.errorGeneric);
      setDonors([]);
    } finally {
      setHasSearched(true);
      setLoading(false);
    }
  }

  useEffect(() => {
    const bg = searchParams.get("bloodGroup") || "";
    const dist = searchParams.get("district") || "";
    const avail = searchParams.get("availableOnly") === "true";
    const validBg = BLOOD_GROUPS.includes(bg as (typeof BLOOD_GROUPS)[number])
      ? bg
      : "";
    const validDist = DISTRICTS.includes(dist as (typeof DISTRICTS)[number])
      ? dist
      : "";
    setBloodGroup(validBg);
    setDistrict(validDist);
    setAvailableOnly(avail);
    void runSearch({
      bloodGroup: validBg,
      district: validDist,
      availableOnly: avail,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="space-y-6">
      <form
        className="grid gap-3 rounded-2xl bg-white/75 p-5 md:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          void runSearch();
        }}
      >
        <label className="text-sm">
          <span className="mb-1 block font-medium">{t.bloodGroup}</span>
          <select
            className="field"
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
          >
            <option value="">{t.any}</option>
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block font-medium">{t.district}</span>
          <select
            className="field"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          >
            <option value="">{t.any}</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-col justify-end gap-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
            />
            {t.availableOnly}
          </label>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? t.loading : t.search}
          </button>
        </div>
      </form>
      {error ? <p className="text-sm text-[var(--blood)]">{error}</p> : null}
      <DonorResults donors={donors} loading={loading} hasSearched={hasSearched} />
    </div>
  );
}

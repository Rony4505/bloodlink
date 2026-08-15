"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { DISTRICTS } from "@/lib/districts";
import { useLocale } from "@/lib/i18n/locale-context";
import type { PublicDonor } from "@/lib/types";

const LOCALE_KEY = "bloodlink_home_district";

function matchDistrictFromText(text: string): string | null {
  const lower = text.toLowerCase();
  for (const d of DISTRICTS) {
    if (lower.includes(d.toLowerCase())) return d;
  }
  // Common Bangla/English city aliases
  if (lower.includes("chittagong")) return "Chattogram";
  if (lower.includes("comilla")) return "Cumilla";
  if (lower.includes("jessore")) return "Jashore";
  if (lower.includes("barisal")) return "Barishal";
  return null;
}

export function HomeDonors() {
  const { t } = useLocale();
  const [donors, setDonors] = useState<PublicDonor[]>([]);
  const [district, setDistrict] = useState("");
  const [locating, setLocating] = useState(false);

  async function load(forDistrict?: string) {
    const params = new URLSearchParams();
    if (forDistrict) params.set("district", forDistrict);
    const res = await fetch(`/api/donors?${params.toString()}`);
    const data = await res.json();
    setDonors((data.donors || []).slice(0, 6));
  }

  useEffect(() => {
    const saved = window.localStorage.getItem(LOCALE_KEY) || "";
    if (saved) {
      setDistrict(saved);
      void load(saved);
      return;
    }
    void load();
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { Accept: "application/json" } },
          );
          const data = await res.json();
          const blob = [
            data?.address?.state,
            data?.address?.county,
            data?.address?.city,
            data?.display_name,
          ]
            .filter(Boolean)
            .join(" ");
          const matched = matchDistrictFromText(blob || "");
          if (matched) {
            setDistrict(matched);
            window.localStorage.setItem(LOCALE_KEY, matched);
            await load(matched);
          }
        } catch {
          // keep default list
        } finally {
          setLocating(false);
        }
      },
      () => setLocating(false),
      { timeout: 8000 },
    );
  }, []);

  async function onDistrictChange(next: string) {
    setDistrict(next);
    if (next) window.localStorage.setItem(LOCALE_KEY, next);
    else window.localStorage.removeItem(LOCALE_KEY);
    await load(next || undefined);
  }

  return (
    <section className="bg-[var(--mist)] px-5 py-20 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--blood-deep)] md:text-4xl">
              {t.nearestDonors}
            </h2>
            <p className="mt-2 text-[color-mix(in_oklab,var(--ink)_70%,white)]">
              {district
                ? `${t.donorsNearYou}: ${district}`
                : locating
                  ? t.detectingLocation
                  : t.nearestDonorsSub}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="field min-w-44"
              value={district}
              onChange={(e) => void onDistrictChange(e.target.value)}
            >
              <option value="">{t.any}</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <Link href="/find" className="btn-ghost">
              {t.viewAll}
            </Link>
          </div>
        </div>

        {!donors.length ? (
          <p className="mt-8 text-sm text-[color-mix(in_oklab,var(--ink)_60%,white)]">
            {t.noResults}
          </p>
        ) : (
          <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {donors.map((d) => (
              <li key={d.id} className="rounded-2xl bg-white/80 px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-[family-name:var(--font-display)] text-lg font-bold">
                    {d.name}
                  </h3>
                  <span className="rounded-md bg-[var(--blood)] px-2 py-0.5 text-xs font-bold text-white">
                    {d.bloodGroup}
                  </span>
                  {d.verified ? <VerifiedBadge label={t.verifiedBadge} /> : null}
                </div>
                <p className="mt-2 text-sm">
                  {d.area}, {d.district}
                </p>
                <p className="mt-1 text-sm">
                  {d.available ? t.available : t.unavailable}
                  {d.avgRating != null
                    ? ` · ★ ${d.avgRating} (${d.ratingCount})`
                    : ""}
                </p>
                <p className="mt-2 text-xs text-[color-mix(in_oklab,var(--ink)_65%,white)]">
                  {d.bloodIssue ? d.bloodIssue : t.noBloodIssue}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

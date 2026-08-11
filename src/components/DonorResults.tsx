"use client";

import { useEffect, useState } from "react";
import { ContactModal } from "@/components/ContactModal";
import { RatingModal } from "@/components/RatingModal";
import { useLocale } from "@/lib/i18n/locale-context";
import type { PublicDonor } from "@/lib/types";

export function DonorResults({ donors }: { donors: PublicDonor[] }) {
  const { t } = useLocale();
  const [active, setActive] = useState<PublicDonor | null>(null);
  const [ratingFor, setRatingFor] = useState<PublicDonor | null>(null);
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.donor?.id) setMyId(data.donor.id);
      })
      .catch(() => undefined);
  }, []);

  if (!donors.length) {
    return (
      <p className="rounded-2xl bg-white/70 px-5 py-8 text-center text-[color-mix(in_oklab,var(--ink)_70%,white)]">
        {t.noResults}
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {donors.map((donor, index) => (
          <li
            key={donor.id}
            className="animate-rise rounded-2xl bg-white/80 px-5 py-4"
            style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-[family-name:var(--font-display)] text-xl font-bold">
                    {donor.name}
                  </h3>
                  <span className="rounded-md bg-[var(--blood)] px-2 py-0.5 text-xs font-bold text-white">
                    {donor.bloodGroup}
                  </span>
                  <span className="rounded-md bg-[color-mix(in_oklab,var(--ink)_8%,white)] px-2 py-0.5 text-xs font-semibold">
                    {donor.gender === "female" ? t.female : t.male}
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                      donor.available
                        ? "bg-[color-mix(in_oklab,var(--sage)_18%,white)] text-[var(--sage)]"
                        : "bg-[color-mix(in_oklab,var(--ink)_8%,white)] text-[color-mix(in_oklab,var(--ink)_55%,white)]"
                    }`}
                  >
                    {donor.available ? t.available : t.unavailable}
                  </span>
                  {donor.avgRating != null ? (
                    <span className="text-xs font-semibold text-[#c9852d]">
                      ★ {donor.avgRating} ({donor.ratingCount})
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-[color-mix(in_oklab,var(--ink)_70%,white)]">
                  {donor.area}, {donor.district}
                </p>
                <p className="mt-1 text-sm">
                  {donor.phoneMasked}
                  <span className="mx-2 text-[var(--line)]">·</span>
                  {t.lastDonation}: {donor.lastDonationDate || t.neverDonated}
                </p>
                <p
                  className={`mt-1 text-sm ${
                    donor.bloodIssue
                      ? "font-medium text-[var(--blood-deep)]"
                      : "text-[color-mix(in_oklab,var(--ink)_60%,white)]"
                  }`}
                >
                  {t.bloodIssue}:{" "}
                  {donor.bloodIssue ? donor.bloodIssue : t.noBloodIssue}
                </p>
                {!donor.available && donor.nextEligibleDate ? (
                  <p className="mt-1 text-sm text-[var(--blood-deep)]">
                    {t.nextEligible}: {donor.nextEligibleDate}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!donor.available}
                  onClick={() => setActive(donor)}
                >
                  {t.getContact}
                </button>
                {myId === donor.id ? (
                  <p className="text-center text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                    {t.cannotRateSelf}
                  </p>
                ) : (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setRatingFor(donor)}
                  >
                    {t.rateDonor}
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      {active ? (
        <ContactModal
          donorId={active.id}
          donorName={active.name}
          onClose={() => setActive(null)}
        />
      ) : null}
      {ratingFor ? (
        <RatingModal
          donorId={ratingFor.id}
          donorName={ratingFor.name}
          onClose={() => setRatingFor(null)}
        />
      ) : null}
    </>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DailyReminder } from "@/components/DailyReminder";
import { DonationBadge } from "@/components/DonationBadge";
import { invalidateDonorStats } from "@/lib/donor-stats-client";
import { useLocale } from "@/lib/i18n/locale-context";

type Donor = {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: "male" | "female";
  bloodGroup: string;
  district: string;
  area: string;
  available: boolean;
  lastDonationDate: string | null;
  nextEligibleDate: string | null;
  waitDays: number;
  bloodIssue: string;
  donationCount?: number;
  avgRating: number | null;
  ratingCount: number;
};

type PendingChange = {
  id: string;
  requestedEmail: string | null;
  requestedPhone: string | null;
  status: string;
} | null;

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/90 px-3.5 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[color-mix(in_oklab,var(--ink)_48%,white)]">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold leading-snug text-[var(--ink)]">
        {value}
      </p>
    </div>
  );
}

export function DashboardClient() {
  const { t } = useLocale();
  const router = useRouter();
  const [donor, setDonor] = useState<Donor | null>(null);
  const [lastDonationDate, setLastDonationDate] = useState("");
  const [donationCount, setDonationCount] = useState(0);
  const [bloodIssue, setBloodIssue] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<PendingChange>(null);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [changeNote, setChangeNote] = useState("");
  const [changeLoading, setChangeLoading] = useState(false);

  async function loadContactChange() {
    const res = await fetch("/api/donors/me/contact-change");
    if (!res.ok) return;
    const data = await res.json();
    setPending(data.pending);
    setOwnerEmail(data.ownerEmail || "");
    setOwnerPhone(data.ownerPhone || "");
  }

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) {
          router.replace("/login");
          return;
        }
        const data = await res.json();
        setDonor(data.donor);
        setLastDonationDate(data.donor.lastDonationDate || "");
        setDonationCount(Number(data.donor.donationCount) || 0);
        setBloodIssue(data.donor.bloodIssue || "");
        await loadContactChange();
      })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!donor) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/donors/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lastDonationDate: lastDonationDate || null,
          donationCount,
          bloodIssue,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errorGeneric);
        return;
      }
      setDonor(data.donor);
      setLastDonationDate(data.donor.lastDonationDate || "");
      setDonationCount(Number(data.donor.donationCount) || 0);
      setBloodIssue(data.donor.bloodIssue || "");
      setMessage(t.saved);
      invalidateDonorStats();
    } catch {
      setError(t.errorGeneric);
    } finally {
      setSaving(false);
    }
  }

  async function submitChangeRequest(e: React.FormEvent) {
    e.preventDefault();
    setChangeLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/donors/me/contact-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestedEmail: newEmail || null,
          requestedPhone: newPhone || null,
          note: changeNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errorGeneric);
        return;
      }
      setPending(data.request);
      setOwnerEmail(data.ownerEmail || ownerEmail);
      setOwnerPhone(data.ownerPhone || ownerPhone);
      setShowChangeForm(false);
      setMessage(t.pendingChangeRequest);
    } catch {
      setError(t.errorGeneric);
    } finally {
      setChangeLoading(false);
    }
  }

  function ownerMailHref() {
    if (!donor || !ownerEmail) return `mailto:${ownerEmail}`;
    const reqEmail = newEmail || pending?.requestedEmail || "";
    const reqPhone = newPhone || pending?.requestedPhone || "";
    const subject = encodeURIComponent(
      `BloodLink contact change — ${donor.name}`,
    );
    const body = encodeURIComponent(
      [
        `Donor: ${donor.name}`,
        `Current email: ${donor.email}`,
        `Current phone: ${donor.phone}`,
        reqEmail ? `Requested email: ${reqEmail}` : "",
        reqPhone ? `Requested phone: ${reqPhone}` : "",
        changeNote ? `Note: ${changeNote}` : "",
        "",
        "Please review this in the BloodLink admin panel.",
      ]
        .filter(Boolean)
        .join("\n"),
    );
    return `mailto:${ownerEmail}?subject=${subject}&body=${body}`;
  }

  if (loading || !donor) {
    return (
      <p className="text-[color-mix(in_oklab,var(--ink)_65%,white)]">{t.loading}</p>
    );
  }

  return (
    <>
      <DailyReminder enabled />
      <div className="space-y-5">
        <div className="overflow-hidden rounded-[28px] border border-[var(--line)] bg-[linear-gradient(165deg,#fff8f4_0%,var(--mist)_45%,#f3ebe4_100%)] shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[color-mix(in_oklab,var(--ink)_50%,white)]">
                {t.dashboardTitle}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-2 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]">
                <DonationBadge count={donor.donationCount || 0} size="md" />
                <span>{donor.name}</span>
              </p>
              <p className="mt-1 text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                {t.donationCountLabel}: {donor.donationCount || 0}
              </p>
              <p
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  donor.available
                    ? "bg-[color-mix(in_oklab,var(--sage)_16%,white)] text-[var(--sage)]"
                    : "bg-[color-mix(in_oklab,var(--blood)_12%,white)] text-[var(--blood-deep)]"
                }`}
              >
                {donor.available ? t.available : t.unavailable}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex h-16 min-w-16 items-center justify-center rounded-2xl bg-[var(--blood)] px-3 font-[family-name:var(--font-display)] text-2xl font-bold text-white shadow-sm">
                {donor.bloodGroup}
              </div>
              <Link
                href="/notifications"
                className="rounded-full border border-[var(--line)] bg-white/90 px-3 py-1.5 text-xs font-semibold text-[var(--blood-deep)] transition hover:bg-white"
              >
                {t.notifications}
              </Link>
            </div>
          </div>

          <div className="space-y-4 p-5">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[color-mix(in_oklab,var(--ink)_50%,white)]">
                {t.lockedFields}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <InfoRow label={t.email} value={donor.email} />
                <InfoRow label={t.phone} value={donor.phone} />
                <InfoRow
                  label={t.gender}
                  value={donor.gender === "female" ? t.female : t.male}
                />
                <InfoRow
                  label={t.district}
                  value={`${donor.district}${donor.area ? ` · ${donor.area}` : ""}`}
                />
                <InfoRow
                  label={t.rating}
                  value={
                    donor.avgRating != null
                      ? `★ ${donor.avgRating} (${donor.ratingCount})`
                      : "—"
                  }
                />
                <InfoRow
                  label={t.nextEligible}
                  value={donor.nextEligibleDate || t.unknown}
                />
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[color-mix(in_oklab,var(--ink)_65%,white)]">
                {t.contactLockedHint}
              </p>
              {pending ? (
                <div className="mt-2 space-y-2">
                  <p className="rounded-xl bg-[color-mix(in_oklab,#c9852d_16%,white)] px-3 py-2 text-sm font-medium">
                    {t.pendingChangeRequest}
                  </p>
                  {ownerEmail ? (
                    <a href={ownerMailHref()} className="btn-ghost inline-flex">
                      {t.emailOwner}
                    </a>
                  ) : null}
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-ghost mt-3"
                  onClick={() => setShowChangeForm((v) => !v)}
                >
                  {t.requestContactChange}
                </button>
              )}
            </div>

            {showChangeForm && !pending ? (
              <form
                onSubmit={submitChangeRequest}
                className="space-y-3 rounded-2xl border border-[var(--line)] bg-white/70 p-4"
              >
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">{t.newEmail}</span>
                  <input
                    className="field"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">{t.newPhone}</span>
                  <input
                    className="field"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">{t.changeReason}</span>
                  <textarea
                    className="field min-h-20"
                    value={changeNote}
                    onChange={(e) => setChangeNote(e.target.value)}
                  />
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={changeLoading}
                  >
                    {changeLoading ? t.loading : t.submitChangeRequest}
                  </button>
                  {ownerEmail ? (
                    <a href={ownerMailHref()} className="btn-ghost flex-1 text-center">
                      {t.emailOwner}
                    </a>
                  ) : null}
                </div>
                {(ownerEmail || ownerPhone) && (
                  <p className="text-xs text-[color-mix(in_oklab,var(--ink)_60%,white)]">
                    {t.ownerContact}: {ownerEmail}
                    {ownerPhone ? ` · ${ownerPhone}` : ""}
                  </p>
                )}
              </form>
            ) : null}
          </div>
        </div>

        <form
          onSubmit={save}
          className="space-y-3 rounded-[28px] border border-[var(--line)] bg-white/85 p-5 shadow-sm"
        >
          <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--blood-deep)]">
            {t.editableFields}
          </h3>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t.lastDonation}</span>
            <input
              className="field"
              type="date"
              value={lastDonationDate}
              onChange={(e) => setLastDonationDate(e.target.value)}
            />
            <span className="mt-1 block text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
              {t.donationCountHint}
            </span>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t.donationCountField}</span>
            <input
              className="field"
              type="number"
              min={0}
              max={500}
              value={donationCount}
              onChange={(e) => setDonationCount(Number(e.target.value) || 0)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t.bloodIssue}</span>
            <textarea
              className="field min-h-24"
              value={bloodIssue}
              onChange={(e) => setBloodIssue(e.target.value)}
              placeholder={t.bloodIssueHint}
            />
          </label>
          {error ? <p className="text-sm text-[var(--blood)]">{error}</p> : null}
          {message ? <p className="text-sm text-[var(--sage)]">{message}</p> : null}
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-[#2f6b4f] px-5 py-3 font-semibold text-white transition hover:bg-[#265a42] disabled:opacity-55"
            disabled={saving}
          >
            {saving ? t.loading : t.saveChanges}
          </button>
        </form>
      </div>
    </>
  );
}

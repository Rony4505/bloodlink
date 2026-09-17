"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { KAJMAMA_BASE } from "@/lib/kajmama/constants";
import { kmApi } from "@/lib/kajmama/client";
import type { SessionUser } from "@/lib/kajmama/types";
import { useKm } from "./KmSession";
import { KmEmpty, KmMoney, KmStatus } from "./KmUi";

type BookingRow = {
  id: string;
  status: string;
  price: number;
  title: string;
  otherName: string;
  categoryName?: string;
  updatedAt: string;
};

export function KmDashboard() {
  const { lang, user, loading, reload, meta } = useKm();
  const bn = lang === "bn";
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [jobs, setJobs] = useState<{ id: string; title: string; status: string; budget: number }[]>([]);
  const [draft, setDraft] = useState<{
    bio: string;
    hourlyRate: string;
    available: boolean;
    district: string;
    upazila: string;
    area: string;
  } | null>(null);
  const [saved, setSaved] = useState("");
  const [pkgBusy, setPkgBusy] = useState("");

  const bio = draft?.bio ?? user?.bio ?? "";
  const hourlyRate = draft?.hourlyRate ?? String(user?.hourlyRate || 0);
  const available = draft?.available ?? user?.available ?? true;
  const district = draft?.district ?? user?.district ?? "ঢাকা";
  const upazila = draft?.upazila ?? user?.upazila ?? "";
  const area = draft?.area ?? user?.area ?? "";

  function patchDraft(patch: Partial<NonNullable<typeof draft>>) {
    setDraft({
      bio,
      hourlyRate,
      available,
      district,
      upazila,
      area,
      ...patch,
    });
  }

  useEffect(() => {
    if (!user) return;
    kmApi<{ bookings: BookingRow[] }>("/api/kajmama/bookings")
      .then((d) => setBookings(d.bookings))
      .catch(() => setBookings([]));
    kmApi<{ jobs: { id: string; title: string; status: string; budget: number }[] }>("/api/kajmama/jobs?mine=1")
      .then((d) => setJobs(d.jobs))
      .catch(() => setJobs([]));
  }, [user]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaved("");
    try {
      await kmApi<{ user: SessionUser }>("/api/kajmama/workers", {
        method: "PATCH",
        body: JSON.stringify({
          bio,
          hourlyRate: Number(hourlyRate),
          jobRate: Number(hourlyRate) * 2,
          available,
          district,
          upazila,
          area,
        }),
      });
      await reload();
      setDraft(null);
      setSaved(bn ? "সেভ হয়েছে" : "Saved");
    } catch (err) {
      setSaved(err instanceof Error ? err.message : "সেভ হয়নি");
    }
  }

  if (loading) {
    return (
      <div className="km-page km-wrap">
        <p className="km-muted">{bn ? "লোড হচ্ছে…" : "Loading…"}</p>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="km-page km-wrap">
        <KmEmpty
          title={bn ? "লগইন করুন" : "Please log in"}
          hint={bn ? "ড্যাশবোর্ড দেখতে অ্যাকাউন্ট লাগবে।" : "An account is required."}
          href={`${KAJMAMA_BASE}/login`}
          cta={bn ? "লগইন" : "Log in"}
        />
      </div>
    );
  }

  return (
    <div className="km-page km-wrap">
      <div className="km-page-head">
        <div>
          <h1>{user.name}</h1>
          <p className="km-muted">
            {user.role === "worker" ? (bn ? "কাজের মানুষ" : "Worker") : bn ? "কাজদাতা" : "Hirer"} · {user.area},{" "}
            {user.district}
          </p>
        </div>
        {user.role === "hirer" ? (
          <Link className="km-btn gold sm" href={`${KAJMAMA_BASE}/jobs/new`}>
            {bn ? "কাজ পোস্ট" : "Post job"}
          </Link>
        ) : (
          <Link className="km-btn gold sm" href={`${KAJMAMA_BASE}/jobs`}>
            {bn ? "কাজ দেখুন" : "See jobs"}
          </Link>
        )}
      </div>

      <div className="km-grid-3" style={{ marginBottom: "1.2rem" }}>
        <div className="km-card">
          <p className="km-muted">{bn ? "বুকিং" : "Bookings"}</p>
          <h2 style={{ margin: 0 }}>{bookings.length}</h2>
        </div>
        <div className="km-card">
          <p className="km-muted">{bn ? "কাজ" : "Jobs"}</p>
          <h2 style={{ margin: 0 }}>{jobs.length}</h2>
        </div>
        <div className="km-card">
          <p className="km-muted">{bn ? "রেটিং" : "Rating"}</p>
          <h2 style={{ margin: 0 }}>{user.rating || "—"}</h2>
        </div>
      </div>

      {user.role === "worker" ? (
        <section style={{ marginBottom: "1.6rem" }}>
          <h2>👑 {bn ? "প্রিমিয়াম মেম্বারশিপ" : "Premium membership"}</h2>
          <p className="km-muted">
            {bn
              ? `এখন: ${user.packageName || user.packageId}${user.packageExpiresAt ? ` · শেষ ${user.packageExpiresAt.slice(0, 10)}` : ""}`
              : `Now: ${user.packageName || user.packageId}${user.packageExpiresAt ? ` · ends ${user.packageExpiresAt.slice(0, 10)}` : ""}`}
          </p>
          <div className="km-grid-3">
            {meta.packages.map((p) => (
              <button
                type="button"
                key={p.id}
                className={`km-plan ${user.packageId === p.id ? "on" : ""} ${p.premium ? "popular" : ""}`}
                disabled={!!pkgBusy}
                onClick={() => {
                  setPkgBusy(p.id);
                  void kmApi<{ user: SessionUser }>("/api/kajmama/workers", {
                    method: "PATCH",
                    body: JSON.stringify({ packageId: p.id, paymentRef: "DEMO" }),
                  })
                    .then(() => reload())
                    .catch((err) => setSaved(err instanceof Error ? err.message : "প্যাকেজ হয়নি"))
                    .finally(() => setPkgBusy(""));
                }}
              >
                <em>{p.price ? `৳ ${p.price}` : bn ? "ফ্রি" : "Free"}</em>
                <h3>{bn ? p.nameBn : p.nameEn}</h3>
                <p className="km-muted">
                  {p.durationDays ? `${p.durationDays} ${bn ? "দিন প্রিমিয়াম" : "days premium"}` : bn ? "বেসিক লিস্টিং" : "Basic listing"}
                </p>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <h2>{bn ? "আমার বুকিং" : "My bookings"}</h2>
      {bookings.length === 0 ? (
        <p className="km-muted">{bn ? "এখনো বুকিং নেই।" : "No bookings yet."}</p>
      ) : (
        <div className="km-list" style={{ marginBottom: "1.4rem" }}>
          {bookings.map((b) => (
            <Link key={b.id} href={`${KAJMAMA_BASE}/bookings/${b.id}`} className="km-card">
              <div className="km-worker-foot">
                <strong>
                  {b.categoryName ? `${b.categoryName} · ` : ""}
                  {b.title}
                </strong>
                <KmStatus status={b.status} />
              </div>
              <p className="km-meta">
                {b.otherName} · <KmMoney amount={b.price} />
              </p>
            </Link>
          ))}
        </div>
      )}

      <form className="km-form km-card" onSubmit={saveProfile}>
        <h3 style={{ margin: 0 }}>{bn ? "প্রোফাইল" : "Profile"}</h3>
        <div className="km-row">
          <label className="km-label">
            {bn ? "জেলা" : "District"}
            <select
              className="km-select"
              value={district}
              onChange={(e) => patchDraft({ district: e.target.value, upazila: "" })}
            >
              {meta.districts.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="km-label">
            {bn ? "উপজেলা" : "Upazila"}
            <select className="km-select" value={upazila} onChange={(e) => patchDraft({ upazila: e.target.value })}>
              <option value="">{bn ? "উপজেলা" : "Upazila"}</option>
              {(meta.upazilas[district] || []).map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </label>
          <label className="km-label">
            {bn ? "এলাকা" : "Area"}
            <input className="km-input" value={area} onChange={(e) => patchDraft({ area: e.target.value })} />
          </label>
        </div>
        {user.role === "worker" ? (
          <>
            <label className="km-label">
              {bn ? "বায়ো" : "Bio"}
              <textarea className="km-textarea" value={bio} onChange={(e) => patchDraft({ bio: e.target.value })} />
            </label>
            <label className="km-label">
              {bn ? "ঘণ্টা রেট" : "Hourly rate"}
              <input className="km-input" value={hourlyRate} onChange={(e) => patchDraft({ hourlyRate: e.target.value })} />
            </label>
            <label className="km-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={available} onChange={(e) => patchDraft({ available: e.target.checked })} />
              {bn ? "এখন কাজ নিতে পারি" : "Available for work"}
            </label>
          </>
        ) : null}
        <p className="km-muted">
          {bn ? "স্কিল" : "Skills"}:{" "}
          {user.skills.map((s) => meta.categories.find((c) => c.id === s)?.nameBn).filter(Boolean).join(", ") || "—"}
        </p>
        {saved ? <p className="km-hint">{saved}</p> : null}
        <button className="km-btn dark" type="submit">
          {bn ? "সেভ" : "Save"}
        </button>
      </form>
    </div>
  );
}

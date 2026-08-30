"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CATEGORIES, DISTRICTS, KAJMAMA_BASE } from "@/lib/kajmama/constants";
import { kmApi } from "@/lib/kajmama/client";
import { timeAgo } from "@/lib/kajmama/format";
import { useKm } from "./KmSession";
import { KmEmpty, KmMoney, KmStatus } from "./KmUi";

type JobRow = {
  id: string;
  title: string;
  description: string;
  district: string;
  area: string;
  budget: number;
  whenText: string;
  status: string;
  createdAt: string;
  hirerName: string;
  category?: { id: string; nameBn: string; nameEn: string; icon: string };
};

export function KmJobs() {
  const { lang, user } = useKm();
  const bn = lang === "bn";
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [category, setCategory] = useState("");
  const [district, setDistrict] = useState("");

  useEffect(() => {
    const sp = new URLSearchParams();
    if (category) sp.set("category", category);
    if (district) sp.set("district", district);
    kmApi<{ jobs: JobRow[] }>(`/api/kajmama/jobs?${sp.toString()}`)
      .then((d) => setJobs(d.jobs))
      .catch(() => setJobs([]));
  }, [category, district]);

  return (
    <div className="km-page km-wrap">
      <div className="km-page-head">
        <div>
          <h1>{bn ? "খোলা কাজ" : "Open jobs"}</h1>
          <p className="km-muted">{bn ? "ওয়ার্কাররা আগ্রহ দেখাতে পারেন।" : "Workers can show interest."}</p>
        </div>
        {user ? (
          <Link className="km-btn gold sm" href={`${KAJMAMA_BASE}/jobs/new`}>
            {bn ? "কাজ পোস্ট" : "Post a job"}
          </Link>
        ) : (
          <Link
            className="km-btn gold sm"
            href={`${KAJMAMA_BASE}/register?role=hirer&next=${encodeURIComponent(`${KAJMAMA_BASE}/jobs/new`)}`}
          >
            {bn ? "কাজ পোস্ট" : "Post a job"}
          </Link>
        )}
      </div>
      <div className="km-filters">
        <select className="km-select" style={{ maxWidth: 200 }} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">{bn ? "সব ক্যাটাগরি" : "All"}</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {bn ? c.nameBn : c.nameEn}
            </option>
          ))}
        </select>
        <select className="km-select" style={{ maxWidth: 180 }} value={district} onChange={(e) => setDistrict(e.target.value)}>
          <option value="">{bn ? "সব জেলা" : "All districts"}</option>
          {DISTRICTS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </div>
      {jobs.length === 0 ? (
        <KmEmpty
          title={bn ? "এখন খোলা কাজ নেই" : "No open jobs"}
          hint={bn ? "কাজদাতা হিসেবে পোস্ট করুন।" : "Post one as a hirer."}
          href={
            user
              ? `${KAJMAMA_BASE}/jobs/new`
              : `${KAJMAMA_BASE}/register?role=hirer&next=${encodeURIComponent(`${KAJMAMA_BASE}/jobs/new`)}`
          }
          cta={bn ? "কাজ পোস্ট" : "Post a job"}
        />
      ) : (
        <div className="km-list">
          {jobs.map((j) => (
            <Link key={j.id} href={`${KAJMAMA_BASE}/jobs/${j.id}`} className="km-card">
              <div className="km-worker-foot">
                <h3 style={{ margin: 0 }}>
                  {j.category?.icon} {j.title}
                </h3>
                <KmStatus status={j.status} />
              </div>
              <p className="km-meta">
                {j.area}, {j.district} · {j.whenText} · {timeAgo(j.createdAt, bn)}
              </p>
              <p>{j.description}</p>
              <div className="km-worker-foot">
                <span className="km-muted">{j.hirerName}</span>
                <KmMoney amount={j.budget} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function KmJobNew() {
  const { lang, user } = useKm();
  const bn = lang === "bn";
  const router = useRouter();
  const params = useSearchParams();
  const [categoryId, setCategoryId] = useState(params.get("category") || CATEGORIES[0].id);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [district, setDistrict] = useState(user?.district || DISTRICTS[0]);
  const [area, setArea] = useState(user?.area || "");
  const [budget, setBudget] = useState("1000");
  const [whenText, setWhenText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const workerId = params.get("worker") || "";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await kmApi<{ bookingId?: string; job: { id: string } }>("/api/kajmama/jobs", {
        method: "POST",
        body: JSON.stringify({
          categoryId,
          title,
          description,
          district,
          area,
          budget: Number(budget),
          whenText,
          workerId: workerId || undefined,
        }),
      });
      router.push(
        data.bookingId ? `${KAJMAMA_BASE}/bookings/${data.bookingId}` : `${KAJMAMA_BASE}/jobs/${data.job.id}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "পোস্ট হয়নি");
      setBusy(false);
    }
  }

  if (!user) {
    const next = encodeURIComponent(`${KAJMAMA_BASE}/jobs/new`);
    return (
      <div className="km-page km-wrap">
        <div className="km-empty">
          <h3>{bn ? "কাজ পোস্ট করতে অ্যাকাউন্ট খুলুন" : "Create an account to post"}</h3>
          <p>{bn ? "কাজদাতা হিসেবে ঢুকলেই পোস্ট করতে পারবেন।" : "Sign in as someone who needs work done."}</p>
          <div className="km-cta" style={{ justifyContent: "center" }}>
            <Link className="km-btn gold" href={`${KAJMAMA_BASE}/register?role=hirer&next=${next}`}>
              {bn ? "অ্যাকাউন্ট খুলুন" : "Sign up"}
            </Link>
            <Link className="km-btn ghost" href={`${KAJMAMA_BASE}/login?next=${next}`}>
              {bn ? "লগইন" : "Log in"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="km-page km-wrap">
      <h1>{workerId ? (bn ? "হায়ার রিকোয়েস্ট" : "Hire request") : bn ? "নতুন কাজ" : "New job"}</h1>
      <form className="km-form wide km-card" onSubmit={onSubmit}>
        <label className="km-label">
          {bn ? "ক্যাটাগরি" : "Category"}
          <select className="km-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {bn ? c.nameBn : c.nameEn}
              </option>
            ))}
          </select>
        </label>
        <label className="km-label">
          {bn ? "শিরোনাম" : "Title"}
          <input className="km-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label className="km-label">
          {bn ? "বিবরণ" : "Details"}
          <textarea className="km-textarea" value={description} onChange={(e) => setDescription(e.target.value)} required />
        </label>
        <div className="km-row">
          <label className="km-label">
            {bn ? "জেলা" : "District"}
            <select className="km-select" value={district} onChange={(e) => setDistrict(e.target.value)}>
              {DISTRICTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="km-label">
            {bn ? "এলাকা" : "Area"}
            <input className="km-input" value={area} onChange={(e) => setArea(e.target.value)} required />
          </label>
        </div>
        <div className="km-row">
          <label className="km-label">
            {bn ? "বাজেট (৳)" : "Budget (৳)"}
            <input className="km-input" value={budget} onChange={(e) => setBudget(e.target.value)} />
          </label>
          <label className="km-label">
            {bn ? "কখন" : "When"}
            <input className="km-input" value={whenText} onChange={(e) => setWhenText(e.target.value)} placeholder={bn ? "আজ সন্ধ্যা" : "This evening"} />
          </label>
        </div>
        {error ? <p className="km-error">{error}</p> : null}
        <button className="km-btn gold" disabled={busy} type="submit">
          {busy ? "..." : bn ? "পাঠান" : "Send"}
        </button>
      </form>
    </div>
  );
}

export function KmJobDetail() {
  const { lang, user } = useKm();
  const bn = lang === "bn";
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<JobRow | null>(null);
  const [canApply, setCanApply] = useState(false);
  const [bookingId, setBookingId] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id || id === "new") return;
    kmApi<{ job: JobRow; canApply: boolean; bookingId?: string }>(`/api/kajmama/jobs/${id}`)
      .then((d) => {
        setJob(d.job);
        setCanApply(d.canApply);
        setBookingId(d.bookingId);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "লোড হয়নি"));
  }, [id]);

  async function apply() {
    setBusy(true);
    setError("");
    try {
      const data = await kmApi<{ bookingId?: string }>(`/api/kajmama/jobs/${id}`, {
        method: "POST",
        body: JSON.stringify({ action: "apply" }),
      });
      if (data.bookingId) router.push(`${KAJMAMA_BASE}/bookings/${data.bookingId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "আগ্রহ যায়নি");
    } finally {
      setBusy(false);
    }
  }

  if (error && !job) {
    return (
      <div className="km-page km-wrap">
        <p className="km-error">{error}</p>
      </div>
    );
  }
  if (!job) {
    return (
      <div className="km-page km-wrap">
        <p className="km-muted">{bn ? "লোড হচ্ছে…" : "Loading…"}</p>
      </div>
    );
  }

  return (
    <div className="km-page km-wrap">
      <article className="km-card">
        <div className="km-worker-foot">
          <h1 style={{ margin: 0, fontSize: "1.8rem" }}>{job.title}</h1>
          <KmStatus status={job.status} />
        </div>
        <p className="km-meta">
          {job.category?.icon} {bn ? job.category?.nameBn : job.category?.nameEn} · {job.area}, {job.district}
        </p>
        <p style={{ lineHeight: 1.65 }}>{job.description}</p>
        <p>
          {bn ? "সময়" : "When"}: {job.whenText} · <KmMoney amount={job.budget} />
        </p>
        {error ? <p className="km-error">{error}</p> : null}
        <div className="km-cta">
          {canApply ? (
            <button className="km-btn gold" type="button" disabled={busy} onClick={() => void apply()}>
              {bn ? "আগ্রহ দেখান" : "Show interest"}
            </button>
          ) : null}
          {bookingId ? (
            <Link className="km-btn dark" href={`${KAJMAMA_BASE}/bookings/${bookingId}`}>
              {bn ? "বুকিং / চ্যাট" : "Booking / chat"}
            </Link>
          ) : null}
          {!user ? (
            <Link className="km-btn gold" href={`${KAJMAMA_BASE}/login`}>
              {bn ? "লগইন করুন" : "Log in"}
            </Link>
          ) : null}
        </div>
      </article>
    </div>
  );
}

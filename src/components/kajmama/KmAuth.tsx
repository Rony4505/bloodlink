"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CATEGORIES, DISTRICTS, KAJMAMA_BASE } from "@/lib/kajmama/constants";
import { kmApi } from "@/lib/kajmama/client";
import type { SessionUser, UserRole } from "@/lib/kajmama/types";
import { useKm } from "./KmSession";

function nextPath(raw: string | null) {
  if (raw && raw.startsWith(KAJMAMA_BASE)) return raw;
  return `${KAJMAMA_BASE}/dashboard`;
}

export function KmLogin() {
  const { reload, lang } = useKm();
  const router = useRouter();
  const params = useSearchParams();
  const bn = lang === "bn";
  const [phone, setPhone] = useState("01722222222");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await kmApi("/api/kajmama/auth", {
        method: "POST",
        body: JSON.stringify({ action: "login", phone, password }),
      });
      await reload();
      router.push(nextPath(params.get("next")));
    } catch (err) {
      setError(err instanceof Error ? err.message : "লগইন হয়নি");
    } finally {
      setBusy(false);
    }
  }

  const registerHref = `${KAJMAMA_BASE}/register${params.get("next") ? `?next=${encodeURIComponent(params.get("next") || "")}&role=hirer` : ""}`;

  return (
    <div className="km-page km-wrap">
      <div className="km-page-head">
        <div>
          <h1>{bn ? "লগইন" : "Log in"}</h1>
          <p className="km-muted">{bn ? "ফোন নম্বর দিয়ে ঢুকুন।" : "Sign in with your mobile number."}</p>
        </div>
      </div>
      <form className="km-form km-card" onSubmit={onSubmit}>
        <label className="km-label">
          {bn ? "মোবাইল" : "Mobile"}
          <input className="km-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label className="km-label">
          {bn ? "পাসওয়ার্ড" : "Password"}
          <input
            className="km-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error ? <p className="km-error">{error}</p> : null}
        <button className="km-btn gold" disabled={busy} type="submit">
          {busy ? "..." : bn ? "ঢুকুন" : "Enter"}
        </button>
        <p className="km-hint">
          {bn ? "ডেমো কাজদাতা" : "Demo hirer"}: 01722222222 / 123456
          <br />
          {bn ? "ডেমো ওয়ার্কার" : "Demo worker"}: 01711111111 / 123456
        </p>
        <p className="km-muted">
          {bn ? "অ্যাকাউন্ট নেই?" : "No account?"}{" "}
          <Link href={registerHref}>{bn ? "খুলুন" : "Sign up"}</Link>
        </p>
      </form>
    </div>
  );
}

export function KmRegister() {
  const { reload, lang } = useKm();
  const router = useRouter();
  const params = useSearchParams();
  const bn = lang === "bn";
  const [role, setRole] = useState<UserRole>(params.get("role") === "worker" ? "worker" : "hirer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [district, setDistrict] = useState(DISTRICTS[0]);
  const [area, setArea] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState("1");
  const [hourlyRate, setHourlyRate] = useState("300");
  const [plan, setPlan] = useState<"basic" | "monthly" | "yearly">("basic");
  const [photoName, setPhotoName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function toggleSkill(id: string) {
    setSkills((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id].slice(0, 4)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await kmApi<{ user: SessionUser }>("/api/kajmama/auth", {
        method: "POST",
        body: JSON.stringify({
          action: "register",
          role,
          name,
          phone,
          password,
          district,
          area,
          skills,
          bio,
          experienceYears: Number(experienceYears),
          hourlyRate: Number(hourlyRate),
          jobRate: Number(hourlyRate) * 2,
        }),
      });
      await reload();
      router.push(nextPath(params.get("next")));
    } catch (err) {
      setError(err instanceof Error ? err.message : "রেজিস্টার হয়নি");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="km-page km-wrap">
      <div className="km-page-head">
        <div>
          <h1>{bn ? "ওয়ার্কার রেজিস্ট্রেশন" : "Create account"}</h1>
          <p className="km-muted">
            {bn ? "নিবন্ধন করুন, কাজের সুযোগ পান। কাজদাতা বা কাজের মানুষ — বেছে নিন।" : "Register and get work — or hire help."}
          </p>
        </div>
      </div>
      <div className="km-reg-grid">
      <form className="km-form wide km-card" onSubmit={onSubmit}>
        <div className="km-role">
          <button type="button" className={role === "hirer" ? "on" : ""} onClick={() => setRole("hirer")}>
            <b>{bn ? "কাজদাতা" : "I need work done"}</b>
            <div className="km-meta">{bn ? "মানুষ হায়ার করব" : "I will hire"}</div>
          </button>
          <button type="button" className={role === "worker" ? "on" : ""} onClick={() => setRole("worker")}>
            <b>{bn ? "কাজের মানুষ" : "I do the work"}</b>
            <div className="km-meta">{bn ? "প্রোফাইল খুলব" : "I will take jobs"}</div>
          </button>
        </div>
        <label className="km-label">
          {bn ? "নাম" : "Name"}
          <input className="km-input" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <div className="km-row">
          <label className="km-label">
            {bn ? "মোবাইল" : "Mobile"}
            <input className="km-input" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </label>
          <label className="km-label">
            {bn ? "পাসওয়ার্ড" : "Password"}
            <input
              className="km-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
        </div>
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
        {role === "worker" ? (
          <>
            <div className="km-label">{bn ? "স্কিল (সর্বোচ্চ ৪টা)" : "Skills (max 4)"}</div>
            <div className="km-chips">
              {CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  className={`km-chip ${skills.includes(c.id) ? "on" : ""}`}
                  onClick={() => toggleSkill(c.id)}
                >
                  {c.icon} {bn ? c.nameBn : c.nameEn}
                </button>
              ))}
            </div>
            <label className="km-label">
              {bn ? "নিজের কথা" : "Bio"}
              <textarea className="km-textarea" value={bio} onChange={(e) => setBio(e.target.value)} />
            </label>
            <div className="km-row">
              <label className="km-label">
                {bn ? "অভিজ্ঞতা (বছর)" : "Experience (years)"}
                <input
                  className="km-input"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                />
              </label>
              <label className="km-label">
                {bn ? "ঘণ্টা রেট (৳)" : "Hourly rate (৳)"}
                <input className="km-input" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
              </label>
            </div>
            <label className="km-upload">
              <input
                type="file"
                accept="image/jpeg,image/png"
                hidden
                onChange={(e) => setPhotoName(e.target.files?.[0]?.name || "")}
              />
              <b>{bn ? "ছবি আপলোড" : "Upload photo"}</b>
              <span>{photoName || (bn ? "JPG/PNG, সর্বোচ্চ ২MB" : "JPG/PNG, max 2MB")}</span>
            </label>
          </>
        ) : null}
        {error ? <p className="km-error">{error}</p> : null}
        <button className="km-btn dark" disabled={busy} type="submit">
          {busy ? "..." : bn ? "আবেদন করুন →" : "Apply →"}
        </button>
        <p className="km-hint">🔒 {bn ? "আপনার তথ্য নিরাপদ ও গোপন থাকবে।" : "Your information stays private."}</p>
        <p className="km-muted">
          {bn ? "আগে থেকে আছেন?" : "Already here?"}{" "}
          <Link href={`${KAJMAMA_BASE}/login${params.get("next") ? `?next=${encodeURIComponent(params.get("next") || "")}` : ""}`}>
            {bn ? "লগইন" : "Log in"}
          </Link>
        </p>
      </form>
      <aside className="km-plans">
        <h2>👑 {bn ? "প্রিমিয়াম প্ল্যানে আরও সুযোগ" : "Get more with premium"}</h2>
        <p className="km-muted">
          {bn
            ? "প্রিমিয়াম ব্যাজ, সার্চে উপরে, হোমপেজে ফিচার — bKash দিয়ে পেমেন্ট।"
            : "Premium badge, top of search, homepage feature — pay with bKash."}
        </p>
        <button type="button" className={`km-plan ${plan === "basic" ? "on" : ""}`} onClick={() => setPlan("basic")}>
          <em>{bn ? "ফ্রি" : "Free"}</em>
          <h3>{bn ? "বেসিক" : "Basic"}</h3>
          <ul>
            <li>{bn ? "বেসিক লিস্টিং" : "Basic listing"}</li>
            <li className="off">{bn ? "টপ সার্চ নয়" : "No top search"}</li>
            <li className="off">{bn ? "প্রিমিয়াম ব্যাজ নয়" : "No premium badge"}</li>
          </ul>
          <span className="km-btn ghost sm">{bn ? "বেসিক দিয়ে চলুন" : "Continue as basic"}</span>
        </button>
        <button type="button" className={`km-plan popular ${plan === "monthly" ? "on" : ""}`} onClick={() => setPlan("monthly")}>
          <span className="km-ribbon-tag">{bn ? "সবচেয়ে জনপ্রিয়" : "Most popular"}</span>
          <em>৳ ২৯৯ / {bn ? "মাস" : "mo"}</em>
          <h3>{bn ? "প্রিমিয়াম মাসিক" : "Premium monthly"}</h3>
          <ul>
            <li>{bn ? "টপ সার্চ প্রাধান্য" : "Top search"}</li>
            <li>{bn ? "প্রিমিয়াম ব্যাজ" : "Premium badge"}</li>
            <li>{bn ? "৩টি ছবি" : "Up to 3 photos"}</li>
          </ul>
          <span className="km-btn gold sm">{bn ? "এই প্ল্যান নিন" : "Select this plan"}</span>
        </button>
        <button type="button" className={`km-plan ${plan === "yearly" ? "on" : ""}`} onClick={() => setPlan("yearly")}>
          <span className="km-ribbon-tag teal">{bn ? "বেস্ট ভ্যালু" : "Best value"}</span>
          <em>৳ ২,৪৯৯ / {bn ? "বছর" : "yr"}</em>
          <h3>{bn ? "প্রিমিয়াম বাৎসরিক" : "Premium yearly"}</h3>
          <ul>
            <li>{bn ? "মাসিকের সব সুবিধা" : "Everything in monthly"}</li>
            <li>{bn ? "হোমপেজে ফিচার" : "Homepage feature"}</li>
          </ul>
          <span className="km-btn dark sm">{bn ? "এই প্ল্যান নিন" : "Select this plan"}</span>
        </button>
        <p className="km-hint">bKash · {bn ? "পেমেন্ট নিরাপদ — ডেমোতে চার্জ হয় না।" : "Secure payment — no charge in demo."}</p>
      </aside>
      </div>
    </div>
  );
}

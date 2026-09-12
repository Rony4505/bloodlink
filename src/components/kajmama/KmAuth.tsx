"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { KAJMAMA_BASE, WORKER_WARNINGS } from "@/lib/kajmama/constants";
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
        <p className="km-muted">
          <Link href={`${KAJMAMA_BASE}/admin`}>{bn ? "সাইট অ্যাডমিন →" : "Site admin →"}</Link>
        </p>
      </form>
    </div>
  );
}

export function KmRegister() {
  const { reload, lang, meta } = useKm();
  const router = useRouter();
  const params = useSearchParams();
  const bn = lang === "bn";
  const [role, setRole] = useState<UserRole>(params.get("role") === "hirer" ? "hirer" : "worker");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [district, setDistrict] = useState("ঢাকা");
  const [upazila, setUpazila] = useState("");
  const [area, setArea] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState("1");
  const [hourlyRate, setHourlyRate] = useState("300");
  const [plan, setPlan] = useState("basic");
  const [photoName, setPhotoName] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [mobileBanking, setMobileBanking] = useState("");
  const [mobileType, setMobileType] = useState("bkash");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function toggleSkill(id: string) {
    setSkills((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id].slice(0, 4)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (role === "worker" && !agreed) {
      setError(bn ? "সতর্কবার্তা পড়ে সম্মত হতে হবে।" : "Please accept the safety warnings.");
      return;
    }
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
          upazila,
          area,
          skills,
          bio,
          experienceYears: Number(experienceYears),
          hourlyRate: Number(hourlyRate),
          jobRate: Number(hourlyRate) * 2,
          packageId: plan,
          payout: {
            bankName,
            bankAccount,
            bankHolder: bankHolder || name,
            mobileBanking,
            mobileBankingType: mobileType,
          },
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
        {role === "worker" ? (
          <aside className="km-warn" role="alert">
            <h3>⚠️ {bn ? "ওয়ার্কারদের জন্য সতর্কবার্তা" : "Safety warnings for workers"}</h3>
            <ol>
              {WORKER_WARNINGS.map((w) => (
                <li key={w.en}>{bn ? w.bn : w.en}</li>
              ))}
            </ol>
            <label className="km-checkrow">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} required />
              {bn
                ? "আমি সব সতর্কবার্তা পড়েছি এবং সাইটের নিয়ম মেনে কাজ করব।"
                : "I have read these warnings and will follow KajMama rules."}
            </label>
          </aside>
        ) : null}
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
            <select
              className="km-select"
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                setUpazila("");
              }}
            >
              {meta.districts.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="km-label">
            {bn ? "উপজেলা" : "Upazila"}
            <select className="km-select" value={upazila} onChange={(e) => setUpazila(e.target.value)}>
              <option value="">{bn ? "উপজেলা" : "Upazila"}</option>
              {(meta.upazilas[district] || []).map((u) => (
                <option key={u}>{u}</option>
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
              {meta.categories.map((c) => (
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
            <h3>{bn ? "পেআউট অ্যাকাউন্ট (আবশ্যক)" : "Payout account (required)"}</h3>
            <p className="km-hint">
              {bn
                ? "সাইট ফি কর্মীর থেকে কাটা হয়। কাজের টাকা এই অ্যাকাউন্টে যাবে।"
                : "Website fee is deducted from the worker. Job money is sent here."}
            </p>
            <input className="km-input" placeholder={bn ? "ব্যাংকের নাম" : "Bank name"} value={bankName} onChange={(e) => setBankName(e.target.value)} required={role === "worker"} />
            <input className="km-input" placeholder={bn ? "অ্যাকাউন্ট নম্বর" : "Account number"} value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} required={role === "worker"} />
            <input className="km-input" placeholder={bn ? "অ্যাকাউন্ট হোল্ডার" : "Account holder"} value={bankHolder} onChange={(e) => setBankHolder(e.target.value)} />
            <div className="km-row">
              <select className="km-select" value={mobileType} onChange={(e) => setMobileType(e.target.value)}>
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
                <option value="rocket">Rocket</option>
              </select>
              <input className="km-input" placeholder="01XXXXXXXXX" value={mobileBanking} onChange={(e) => setMobileBanking(e.target.value)} required={role === "worker"} />
            </div>
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
            ? "প্যাকেজ নিলে অটো প্রিমিয়াম। সময় শেষে প্রিমিয়াম অটো শেষ।"
            : "A paid package turns premium on automatically, then expires on its own."}
        </p>
        {(meta.packages.length ? meta.packages : []).map((p) => (
          <button
            type="button"
            key={p.id}
            className={`km-plan ${p.premium ? "popular" : ""} ${plan === p.id ? "on" : ""}`}
            onClick={() => setPlan(p.id)}
          >
            {p.premium ? <span className="km-ribbon-tag">{bn ? "প্রিমিয়াম" : "Premium"}</span> : null}
            <em>{p.price ? `৳ ${p.price}` : bn ? "ফ্রি" : "Free"}</em>
            <h3>{bn ? p.nameBn : p.nameEn}</h3>
            <ul>
              {(bn ? p.featuresBn : p.featuresEn).map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <span className={`km-btn ${p.premium ? "gold" : "ghost"} sm`}>
              {plan === p.id ? (bn ? "নির্বাচিত" : "Selected") : bn ? "এই প্ল্যান নিন" : "Select this plan"}
            </span>
          </button>
        ))}
        <p className="km-hint">bKash · {bn ? "পেমেন্ট নিরাপদ — ডেমোতে চার্জ হয় না।" : "Secure payment — no charge in demo."}</p>
      </aside>
      </div>
    </div>
  );
}

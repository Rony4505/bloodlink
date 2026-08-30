"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CATEGORIES, DISTRICTS, KAJMAMA_BASE } from "@/lib/kajmama/constants";
import { kmApi } from "@/lib/kajmama/client";
import type { SessionUser, UserRole } from "@/lib/kajmama/types";
import { useKm } from "./KmSession";

export function KmLogin() {
  const { reload, lang } = useKm();
  const router = useRouter();
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
      router.push(`${KAJMAMA_BASE}/dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "লগইন হয়নি");
    } finally {
      setBusy(false);
    }
  }

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
          <Link href={`${KAJMAMA_BASE}/register`}>{bn ? "খুলুন" : "Sign up"}</Link>
        </p>
      </form>
    </div>
  );
}

export function KmRegister() {
  const { reload, lang } = useKm();
  const router = useRouter();
  const bn = lang === "bn";
  const [role, setRole] = useState<UserRole>("hirer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [district, setDistrict] = useState(DISTRICTS[0]);
  const [area, setArea] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState("1");
  const [hourlyRate, setHourlyRate] = useState("300");
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
      router.push(`${KAJMAMA_BASE}/dashboard`);
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
          <h1>{bn ? "অ্যাকাউন্ট খুলুন" : "Create account"}</h1>
          <p className="km-muted">{bn ? "কাজদাতা বা কাজের মানুষ — বেছে নিন।" : "Hire help, or offer your skill."}</p>
        </div>
      </div>
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
                  style={skills.includes(c.id) ? { borderColor: "#c6a35a", background: "#fbf6ea" } : undefined}
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
          </>
        ) : null}
        {error ? <p className="km-error">{error}</p> : null}
        <button className="km-btn gold" disabled={busy} type="submit">
          {busy ? "..." : bn ? "অ্যাকাউন্ট তৈরি" : "Create account"}
        </button>
        <p className="km-muted">
          {bn ? "আগে থেকে আছেন?" : "Already here?"}{" "}
          <Link href={`${KAJMAMA_BASE}/login`}>{bn ? "লগইন" : "Log in"}</Link>
        </p>
      </form>
    </div>
  );
}

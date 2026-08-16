"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { planLabel } from "@/lib/cricket/format";
import type { RentalPlan } from "@/lib/cricket/types";
import "./cricket.css";

type TenantRow = {
  id: string;
  slug: string;
  name: string;
  contactPhone: string;
  plan: RentalPlan;
  expiresAt: string;
  active: boolean;
  brandColor: string;
};

export function OwnerAdmin() {
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [msg, setMsg] = useState("");
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [phone, setPhone] = useState("");
  const [tenantPin, setTenantPin] = useState("1234");
  const [plan, setPlan] = useState<RentalPlan>("event");
  const [days, setDays] = useState(3);

  function login() {
    startTransition(async () => {
      const res = await fetch("/api/cricket/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "owner_login", ownerPin: pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "পিন ভুল");
        return;
      }
      sessionStorage.setItem("pl-owner-pin", pin);
      setTenants(data.tenants);
      setAuthed(true);
      setMsg("");
    });
  }

  useEffect(() => {
    const saved = sessionStorage.getItem("pl-owner-pin");
    if (saved) {
      setPin(saved);
    }
  }, []);

  function createTenant() {
    startTransition(async () => {
      const res = await fetch("/api/cricket/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_tenant",
          ownerPin: pin,
          name,
          slug,
          contactPhone: phone,
          pin: tenantPin,
          plan,
          days,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "তৈরি ব্যর্থ");
        return;
      }
      setMsg(`তৈরি: /cricket/t/${data.tenant.slug}`);
      setTenants((prev) => [data.tenant, ...prev]);
      setName("");
      setSlug("");
    });
  }

  function extend(id: string, moreDays: number) {
    startTransition(async () => {
      const res = await fetch("/api/cricket/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_tenant",
          ownerPin: pin,
          tenantId: id,
          days: moreDays,
          active: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "আপডেট ব্যর্থ");
        return;
      }
      setTenants((prev) => prev.map((t) => (t.id === id ? data.tenant : t)));
      setMsg("রেন্ট বাড়ানো হয়েছে");
    });
  }

  function toggle(id: string, active: boolean) {
    startTransition(async () => {
      const res = await fetch("/api/cricket/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_tenant",
          ownerPin: pin,
          tenantId: id,
          active,
        }),
      });
      const data = await res.json();
      if (!res.ok) return;
      setTenants((prev) => prev.map((t) => (t.id === id ? data.tenant : t)));
    });
  }

  return (
    <div className="pl-shell">
      <div className="pl-admin">
        <header className="pl-topbar">
          <Link href="/cricket">← PitchLive</Link>
          <span>রেন্ট অ্যাডমিন</span>
        </header>

        {!authed ? (
          <section className="pl-card-block">
            <h1>ওনার লগইন</h1>
            <p className="pl-muted">ডিফল্ট পিন: 4505</p>
            <div className="pl-form">
              <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Owner PIN" />
              <button type="button" className="pl-btn primary" disabled={pending} onClick={login}>
                প্রবেশ
              </button>
            </div>
            {msg ? <p className="pl-error">{msg}</p> : null}
          </section>
        ) : (
          <>
            <h1>রেন্টাল ম্যানেজমেন্ট</h1>
            <p className="pl-muted">নতুন ক্লাব/আয়োজককে সাবস্ক্রিপশন দিন</p>

            <section className="pl-card-block">
              <h2>নতুন রেন্ট</h2>
              <div className="pl-form">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ক্লাবের নাম" />
                <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug (english-ish)" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="ফোন" />
                <input value={tenantPin} onChange={(e) => setTenantPin(e.target.value)} placeholder="ক্লাব পিন" />
                <select value={plan} onChange={(e) => setPlan(e.target.value as RentalPlan)}>
                  <option value="daily">দৈনিক</option>
                  <option value="weekly">সাপ্তাহিক</option>
                  <option value="monthly">মাসিক</option>
                  <option value="event">ইভেন্ট</option>
                </select>
                <input
                  type="number"
                  min={1}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value) || 1)}
                  placeholder="দিন"
                />
                <button type="button" className="pl-btn primary" disabled={pending} onClick={createTenant}>
                  রেন্ট তৈরি
                </button>
              </div>
            </section>

            <section className="pl-match-list">
              {tenants.map((t) => (
                <div key={t.id} className="pl-card-block">
                  <strong>{t.name}</strong>
                  <p className="pl-muted">
                    /cricket/t/{t.slug} · {planLabel(t.plan)} · মেয়াদ{" "}
                    {new Date(t.expiresAt).toLocaleDateString("bn-BD")} ·{" "}
                    {t.active ? "সক্রিয়" : "বন্ধ"}
                  </p>
                  <div className="pl-actions-row wrap">
                    <Link className="pl-btn" href={`/cricket/t/${t.slug}`}>
                      খুলুন
                    </Link>
                    <button type="button" className="pl-btn" onClick={() => extend(t.id, 7)}>
                      +৭ দিন
                    </button>
                    <button type="button" className="pl-btn ghost" onClick={() => toggle(t.id, !t.active)}>
                      {t.active ? "বন্ধ করুন" : "চালু করুন"}
                    </button>
                  </div>
                </div>
              ))}
            </section>
            {msg ? <p className="pl-muted">{msg}</p> : null}
          </>
        )}
      </div>
    </div>
  );
}

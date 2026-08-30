"use client";

import { useEffect, useState } from "react";
import { AD_PLACEMENTS } from "@/lib/kajmama/types";
import type { Advertisement, PackagePlan } from "@/lib/kajmama/types";
import { kmApi } from "@/lib/kajmama/client";
import { useKm } from "./KmSession";

type WorkerRow = {
  id: string;
  name: string;
  phone: string;
  district: string;
  upazila: string;
  area: string;
  skills: string[];
  packageId: string;
  packageName?: string;
  packageExpiresAt: string | null;
  premium: boolean;
  verified: boolean;
  blocked: boolean;
  available: boolean;
  payout?: { bankName: string; bankAccount: string; mobileBanking: string; mobileBankingType: string };
};

type AdminData = {
  stats: {
    users: number;
    workers: number;
    hirers: number;
    jobs: number;
    bookings: number;
    paid: number;
    pendingPay: number;
    feeCollected: number;
  };
  settings: {
    commissionPct: number;
    contactPhone: string;
    contactEmail: string;
    contactWhatsapp: string;
    contactFacebook: string;
    banks: { id: string; bankName: string; accountName: string; accountNumber: string; branch: string }[];
    mobiles: { id: string; type: string; number: string; name: string }[];
  };
  packages: PackagePlan[];
  categories: { id: string; nameBn: string; nameEn: string; icon: string }[];
  ads: Advertisement[];
  workers: WorkerRow[];
  bookings: {
    id: string;
    status: string;
    price: number;
    siteFee: number;
    workerPayout: number;
    workerName?: string;
    hirerName?: string;
    createdAt: string;
    paidAt?: string;
  }[];
};

type Tab = "workers" | "packages" | "categories" | "pay" | "ads" | "export" | "support" | "bookings";

export function KmAdmin() {
  const { lang } = useKm();
  const bn = lang === "bn";
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("workers");
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState("");

  async function load() {
    const d = await kmApi<AdminData>("/api/kajmama/admin");
    setData(d);
    setAuthed(true);
  }

  useEffect(() => {
    let live = true;
    kmApi<AdminData>("/api/kajmama/admin")
      .then((d) => {
        if (!live) return;
        setData(d);
        setAuthed(true);
      })
      .catch(() => {
        if (live) setAuthed(false);
      });
    return () => {
      live = false;
    };
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await kmApi("/api/kajmama/admin", { method: "POST", body: JSON.stringify({ action: "login", pin }) });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "লগইন হয়নি");
    }
  }

  async function act(payload: Record<string, unknown>) {
    await kmApi("/api/kajmama/admin", { method: "POST", body: JSON.stringify(payload) });
    await load();
  }

  if (!authed) {
    return (
      <div className="km-page km-wrap">
        <h1>KajMama Admin</h1>
        <form className="km-form km-card" onSubmit={login}>
          <label className="km-label">
            PIN
            <input className="km-input" value={pin} onChange={(e) => setPin(e.target.value)} />
          </label>
          {error ? <p className="km-error">{error}</p> : null}
          <button className="km-btn dark" type="submit">
            {bn ? "ঢুকুন" : "Enter"}
          </button>
          <p className="km-hint">Demo PIN: 1122</p>
        </form>
      </div>
    );
  }

  const tabs: { id: Tab; bn: string; en: string }[] = [
    { id: "workers", bn: "কর্মী", en: "Workers" },
    { id: "bookings", bn: "পেমেন্ট", en: "Payments" },
    { id: "packages", bn: "প্যাকেজ", en: "Packages" },
    { id: "categories", bn: "ক্যাটাগরি", en: "Categories" },
    { id: "pay", bn: "ফি ও অ্যাকাউন্ট", en: "Fee & accounts" },
    { id: "ads", bn: "বিজ্ঞাপন", en: "Ads" },
    { id: "export", bn: "এক্সেল/প্রিন্ট", en: "Export" },
    { id: "support", bn: "চ্যাট", en: "Chat" },
  ];

  return (
    <div className="km-page km-wrap">
      <h1>KajMama Admin</h1>
      <div className="km-grid-3" style={{ margin: "1rem 0" }}>
        <div className="km-card">
          <p className="km-muted">{bn ? "কর্মী" : "Workers"}</p>
          <h2 style={{ margin: 0 }}>{data?.stats.workers}</h2>
        </div>
        <div className="km-card">
          <p className="km-muted">{bn ? "পেমেন্ট বাকি" : "Unpaid jobs"}</p>
          <h2 style={{ margin: 0 }}>{data?.stats.pendingPay}</h2>
        </div>
        <div className="km-card">
          <p className="km-muted">{bn ? "সাইট ফি সংগ্রহ" : "Fees collected"}</p>
          <h2 style={{ margin: 0 }}>৳{data?.stats.feeCollected}</h2>
        </div>
      </div>
      <div className="km-tabs" style={{ flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button key={t.id} type="button" className={tab === t.id ? "on" : ""} onClick={() => setTab(t.id)}>
            {bn ? t.bn : t.en}
          </button>
        ))}
      </div>
      {tab === "workers" ? <WorkersTab data={data} bn={bn} act={act} /> : null}
      {tab === "packages" ? <PackagesTab data={data} bn={bn} act={act} /> : null}
      {tab === "categories" ? <CatsTab data={data} bn={bn} act={act} /> : null}
      {tab === "pay" ? <PayTab data={data} bn={bn} act={act} /> : null}
      {tab === "ads" ? <AdsTab data={data} bn={bn} act={act} /> : null}
      {tab === "export" ? <ExportTab bn={bn} /> : null}
      {tab === "support" ? <SupportTab bn={bn} /> : null}
      {tab === "bookings" ? <BookingsTab data={data} bn={bn} act={act} /> : null}
    </div>
  );
}

function WorkersTab({
  data,
  bn,
  act,
}: {
  data: AdminData | null;
  bn: boolean;
  act: (p: Record<string, unknown>) => Promise<void>;
}) {
  return (
    <div className="km-card" style={{ overflowX: "auto" }}>
      <table className="km-table">
        <thead>
          <tr>
            <th>{bn ? "নাম" : "Name"}</th>
            <th>Phone</th>
            <th>{bn ? "এলাকা" : "Area"}</th>
            <th>{bn ? "প্যাকেজ" : "Package"}</th>
            <th>{bn ? "ব্যাংক / মোবাইল" : "Payout"}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data?.workers.map((u) => (
            <tr key={u.id}>
              <td>
                {u.name} {u.premium ? "👑" : ""} {u.available ? "" : "⏸"}
              </td>
              <td>{u.phone}</td>
              <td>
                {u.upazila}, {u.district}
              </td>
              <td>
                {u.packageName || u.packageId}
                <br />
                <span className="km-meta">{u.packageExpiresAt ? u.packageExpiresAt.slice(0, 10) : "—"}</span>
                <select
                  className="km-select"
                  value={u.packageId}
                  onChange={(e) => void act({ action: "setPackage", userId: u.id, packageId: e.target.value })}
                >
                  {data.packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {bn ? p.nameBn : p.nameEn}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                {u.payout?.bankName} {u.payout?.bankAccount}
                <br />
                {u.payout?.mobileBankingType} {u.payout?.mobileBanking}
              </td>
              <td>
                <button type="button" className="km-btn ghost sm" onClick={() => void act({ action: "verify", userId: u.id, verified: !u.verified })}>
                  {u.verified ? "Unverify" : "Verify"}
                </button>{" "}
                <button type="button" className="km-btn ghost sm" onClick={() => void act({ action: "block", userId: u.id, blocked: !u.blocked })}>
                  {u.blocked ? "Unblock" : "Block"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PackagesTab({
  data,
  bn,
  act,
}: {
  data: AdminData | null;
  bn: boolean;
  act: (p: Record<string, unknown>) => Promise<void>;
}) {
  const [draft, setDraft] = useState({
    id: "",
    nameBn: "",
    nameEn: "",
    price: "0",
    durationDays: "30",
    premium: true,
  });
  return (
    <div>
      <form
        className="km-card km-form wide"
        onSubmit={(e) => {
          e.preventDefault();
          void act({
            action: "savePackage",
            pkg: {
              id: draft.id || undefined,
              nameBn: draft.nameBn,
              nameEn: draft.nameEn,
              price: Number(draft.price),
              durationDays: Number(draft.durationDays),
              premium: draft.premium,
              featuresBn: [],
              featuresEn: [],
              active: true,
            },
          }).then(() => setDraft({ id: "", nameBn: "", nameEn: "", price: "0", durationDays: "30", premium: true }));
        }}
      >
        <h3>{draft.id ? (bn ? "প্যাকেজ এডিট" : "Edit package") : bn ? "নতুন প্যাকেজ" : "Add package"}</h3>
        <div className="km-row">
          <input className="km-input" placeholder="বাংলা নাম" value={draft.nameBn} onChange={(e) => setDraft({ ...draft, nameBn: e.target.value })} />
          <input className="km-input" placeholder="English name" value={draft.nameEn} onChange={(e) => setDraft({ ...draft, nameEn: e.target.value })} />
        </div>
        <div className="km-row">
          <input className="km-input" placeholder="৳" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
          <input className="km-input" placeholder="দিন" value={draft.durationDays} onChange={(e) => setDraft({ ...draft, durationDays: e.target.value })} />
        </div>
        <label className="km-checkrow">
          <input type="checkbox" checked={draft.premium} onChange={(e) => setDraft({ ...draft, premium: e.target.checked })} />
          Premium
        </label>
        <button className="km-btn dark sm" type="submit">
          {bn ? "সেভ" : "Save"}
        </button>
      </form>
      <div className="km-grid-3" style={{ marginTop: "1rem" }}>
        {data?.packages.map((p) => (
          <article key={p.id} className="km-card">
            <h3>
              {bn ? p.nameBn : p.nameEn} · ৳{p.price}
            </h3>
            <p className="km-meta">
              {p.durationDays || "∞"} {bn ? "দিন" : "days"} {p.premium ? "· PREMIUM" : ""}
            </p>
            <button
              type="button"
              className="km-btn ghost sm"
              onClick={() =>
                setDraft({
                  id: p.id,
                  nameBn: p.nameBn,
                  nameEn: p.nameEn,
                  price: String(p.price),
                  durationDays: String(p.durationDays),
                  premium: p.premium,
                })
              }
            >
              {bn ? "এডিট" : "Edit"}
            </button>
            {p.id !== "basic" ? (
              <button type="button" className="km-btn ghost sm" onClick={() => void act({ action: "deletePackage", packageId: p.id })}>
                {bn ? "মুছুন" : "Delete"}
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}

function CatsTab({
  data,
  bn,
  act,
}: {
  data: AdminData | null;
  bn: boolean;
  act: (p: Record<string, unknown>) => Promise<void>;
}) {
  const [nameBn, setNameBn] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [icon, setIcon] = useState("🛠️");
  return (
    <div>
      <form
        className="km-card km-form"
        onSubmit={(e) => {
          e.preventDefault();
          void act({ action: "addCategory", nameBn, nameEn, icon });
          setNameBn("");
          setNameEn("");
        }}
      >
        <h3>{bn ? "ক্যাটাগরি যোগ" : "Add category"}</h3>
        <input className="km-input" placeholder="বাংলা" value={nameBn} onChange={(e) => setNameBn(e.target.value)} />
        <input className="km-input" placeholder="English" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
        <input className="km-input" placeholder="icon" value={icon} onChange={(e) => setIcon(e.target.value)} />
        <button className="km-btn dark sm" type="submit">
          {bn ? "যোগ করুন" : "Add"}
        </button>
      </form>
      <div className="km-chips" style={{ marginTop: "1rem" }}>
        {data?.categories.map((c) => (
          <span key={c.id} className="km-chip">
            {c.icon} {bn ? c.nameBn : c.nameEn}
          </span>
        ))}
      </div>
    </div>
  );
}

function PayTab({
  data,
  bn,
  act,
}: {
  data: AdminData | null;
  bn: boolean;
  act: (p: Record<string, unknown>) => Promise<void>;
}) {
  const [pct, setPct] = useState(String(data?.settings.commissionPct ?? 10));
  const [phone, setPhone] = useState(data?.settings.contactPhone || "");
  const [email, setEmail] = useState(data?.settings.contactEmail || "");
  const [wa, setWa] = useState(data?.settings.contactWhatsapp || "");
  const [fb, setFb] = useState(data?.settings.contactFacebook || "");
  const [bank, setBank] = useState({ bankName: "", accountName: "", accountNumber: "", branch: "" });
  const [mob, setMob] = useState({ type: "bkash", number: "", name: "KajMama BD" });
  return (
    <div className="km-form wide">
      <form
        className="km-card"
        onSubmit={(e) => {
          e.preventDefault();
          void act({
            action: "saveSettings",
            commissionPct: Number(pct),
            contactPhone: phone,
            contactEmail: email,
            contactWhatsapp: wa,
            contactFacebook: fb,
          });
        }}
      >
        <h3>{bn ? "প্রতি কাজের ফি % (কর্মী থেকে)" : "Job fee % (from worker)"}</h3>
        <input className="km-input" value={pct} onChange={(e) => setPct(e.target.value)} />
        <h3>{bn ? "কন্টাক্ট" : "Contact"}</h3>
        <input className="km-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="phone" />
        <input className="km-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
        <input className="km-input" value={wa} onChange={(e) => setWa(e.target.value)} placeholder="whatsapp" />
        <input className="km-input" value={fb} onChange={(e) => setFb(e.target.value)} placeholder="facebook url" />
        <button className="km-btn dark sm" type="submit">
          {bn ? "সেভ" : "Save"}
        </button>
      </form>
      <div className="km-card" style={{ marginTop: "1rem" }}>
        <h3>{bn ? "অ্যাডমিন ব্যাংক / মোবাইল ব্যাংকিং" : "Admin bank / mobile banking"}</h3>
        {data?.settings.banks.map((b) => (
          <p key={b.id} className="km-meta">
            {b.bankName} · {b.accountName} · {b.accountNumber} ({b.branch}){" "}
            <button type="button" className="km-btn ghost sm" onClick={() => void act({ action: "removePay", id: b.id })}>
              ×
            </button>
          </p>
        ))}
        {data?.settings.mobiles.map((m) => (
          <p key={m.id} className="km-meta">
            {m.type} · {m.number} · {m.name}{" "}
            <button type="button" className="km-btn ghost sm" onClick={() => void act({ action: "removePay", id: m.id })}>
              ×
            </button>
          </p>
        ))}
        <div className="km-row">
          <input className="km-input" placeholder="Bank" value={bank.bankName} onChange={(e) => setBank({ ...bank, bankName: e.target.value })} />
          <input className="km-input" placeholder="Account name" value={bank.accountName} onChange={(e) => setBank({ ...bank, accountName: e.target.value })} />
          <input className="km-input" placeholder="Number" value={bank.accountNumber} onChange={(e) => setBank({ ...bank, accountNumber: e.target.value })} />
          <button type="button" className="km-btn dark sm" onClick={() => void act({ action: "addBank", ...bank })}>
            + Bank
          </button>
        </div>
        <div className="km-row" style={{ marginTop: 8 }}>
          <select className="km-select" value={mob.type} onChange={(e) => setMob({ ...mob, type: e.target.value })}>
            <option value="bkash">bKash</option>
            <option value="nagad">Nagad</option>
            <option value="rocket">Rocket</option>
          </select>
          <input className="km-input" placeholder="01..." value={mob.number} onChange={(e) => setMob({ ...mob, number: e.target.value })} />
          <button type="button" className="km-btn dark sm" onClick={() => void act({ action: "addMobile", ...mob })}>
            + Mobile
          </button>
        </div>
      </div>
    </div>
  );
}

function AdsTab({
  data,
  bn,
  act,
}: {
  data: AdminData | null;
  bn: boolean;
  act: (p: Record<string, unknown>) => Promise<void>;
}) {
  const [ad, setAd] = useState({
    title: "",
    subtitle: "",
    imageUrl: "",
    href: "/kajmama/register",
    ctaBn: "দেখুন",
    ctaEn: "View",
    placement: "home_hero",
  });
  return (
    <div>
      <form
        className="km-card km-form wide"
        onSubmit={(e) => {
          e.preventDefault();
          void act({ action: "saveAd", ad: { ...ad, active: true } });
        }}
      >
        <h3>{bn ? "প্রিমিয়াম বিজ্ঞাপন — যেখানে খুশি সেট করুন" : "Premium ad — place anywhere"}</h3>
        <input className="km-input" placeholder="Title" value={ad.title} onChange={(e) => setAd({ ...ad, title: e.target.value })} />
        <input className="km-input" placeholder="Subtitle" value={ad.subtitle} onChange={(e) => setAd({ ...ad, subtitle: e.target.value })} />
        <input className="km-input" placeholder="Image URL" value={ad.imageUrl} onChange={(e) => setAd({ ...ad, imageUrl: e.target.value })} />
        <input className="km-input" placeholder="Link" value={ad.href} onChange={(e) => setAd({ ...ad, href: e.target.value })} />
        <select className="km-select" value={ad.placement} onChange={(e) => setAd({ ...ad, placement: e.target.value })}>
          {AD_PLACEMENTS.map((p) => (
            <option key={p.id} value={p.id}>
              {bn ? p.bn : p.en}
            </option>
          ))}
        </select>
        <button className="km-btn gold" type="submit">
          {bn ? "বিজ্ঞাপন সেভ" : "Save ad"}
        </button>
      </form>
      <div className="km-list" style={{ marginTop: "1rem" }}>
        {data?.ads.map((a) => (
          <div key={a.id} className="km-card">
            <b>{a.title}</b> · {a.placement} {a.active ? "●" : "○"}
            <button type="button" className="km-btn ghost sm" onClick={() => void act({ action: "deleteAd", adId: a.id })}>
              {bn ? "মুছুন" : "Delete"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExportTab({ bn }: { bn: boolean }) {
  const [kind, setKind] = useState("workers");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const qs = `kind=${kind}&from=${from}&to=${to}`;
  return (
    <div className="km-card km-form">
      <h3>{bn ? "তারিখ অনুযায়ী ডেটা" : "Date-wise data"}</h3>
      <select className="km-select" value={kind} onChange={(e) => setKind(e.target.value)}>
        <option value="workers">{bn ? "কর্মী" : "Workers"}</option>
        <option value="hirers">{bn ? "কাজদাতা" : "Hirers"}</option>
        <option value="jobs">{bn ? "কাজ" : "Jobs"}</option>
        <option value="bookings">{bn ? "বুকিং" : "Bookings"}</option>
        <option value="payments">{bn ? "পেমেন্ট" : "Payments"}</option>
        <option value="reviews">Reviews</option>
      </select>
      <div className="km-row">
        <input className="km-input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input className="km-input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <a className="km-btn gold" href={`/api/kajmama/admin/export?${qs}`}>
        Excel / CSV
      </a>
      <button type="button" className="km-btn dark" onClick={() => window.print()}>
        {bn ? "প্রিন্ট" : "Print"}
      </button>
    </div>
  );
}

function SupportTab({ bn }: { bn: boolean }) {
  const [threads, setThreads] = useState<{ visitorKey: string; name: string; lastText: string; messages: { id: string; from: string; text: string }[] }[]>([]);
  const [open, setOpen] = useState("");
  const [reply, setReply] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    kmApi<{ threads: typeof threads }>("/api/kajmama/support")
      .then((d) => {
        if (live) setThreads(d.threads || []);
      })
      .catch(() => {
        if (live) setThreads([]);
      });
    return () => {
      live = false;
    };
  }, [tick]);

  return (
    <div className="km-card">
      <h3>{bn ? "ভিজিটর চ্যাট" : "Visitor chat"}</h3>
      {threads.map((t) => (
        <button key={t.visitorKey} type="button" className="km-plan" onClick={() => setOpen(t.visitorKey)}>
          <b>{t.name}</b>
          <p className="km-meta">{t.lastText}</p>
        </button>
      ))}
      {open ? (
        <form
          className="km-form"
          onSubmit={(e) => {
            e.preventDefault();
            void kmApi("/api/kajmama/support", {
              method: "POST",
              body: JSON.stringify({ action: "admin-reply", visitorKey: open, text: reply }),
            }).then(() => {
              setReply("");
              setTick((n) => n + 1);
            });
          }}
        >
          {(threads.find((t) => t.visitorKey === open)?.messages || []).map((m) => (
            <p key={m.id}>
              <b>{m.from}:</b> {m.text}
            </p>
          ))}
          <input className="km-input" value={reply} onChange={(e) => setReply(e.target.value)} />
          <button className="km-btn gold sm" type="submit">
            {bn ? "রিপ্লাই" : "Reply"}
          </button>
        </form>
      ) : null}
    </div>
  );
}

function BookingsTab({
  data,
  bn,
  act,
}: {
  data: AdminData | null;
  bn: boolean;
  act: (p: Record<string, unknown>) => Promise<void>;
}) {
  return (
    <div className="km-card" style={{ overflowX: "auto" }}>
      <table className="km-table">
        <thead>
          <tr>
            <th>{bn ? "কাজদাতা" : "Hirer"}</th>
            <th>{bn ? "কর্মী" : "Worker"}</th>
            <th>{bn ? "মূল্য" : "Price"}</th>
            <th>{bn ? "সাইট ফি" : "Fee"}</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data?.bookings.map((b) => (
            <tr key={b.id}>
              <td>{b.hirerName}</td>
              <td>{b.workerName}</td>
              <td>৳{b.price}</td>
              <td>৳{b.siteFee}</td>
              <td>{b.status}</td>
              <td>
                {b.status === "completed" ? (
                  <button type="button" className="km-btn gold sm" onClick={() => void act({ action: "markPaid", bookingId: b.id, paymentMethod: "admin", paymentRef: "ADMIN" })}>
                    {bn ? "পেইড মার্ক" : "Mark paid"}
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

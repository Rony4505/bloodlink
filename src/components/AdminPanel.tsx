"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";

type AdminDonor = {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  bloodGroup: string;
  district: string;
  area: string;
  available: boolean;
  lastDonationDate: string | null;
  nextEligibleDate: string | null;
  bloodIssue: string;
  avgRating: number | null;
  ratingCount: number;
};

type ContactRequest = {
  id: string;
  seekerName: string;
  seekerPhone: string;
  hospital: string;
  createdAt: string;
  donorId: string;
  donorName: string;
  donorPhone: string;
  donorBloodGroup: string;
  donorDistrict: string;
  donorArea: string;
};

type ContactChangeRequest = {
  id: string;
  donorId: string;
  donorName: string;
  currentEmail: string;
  currentPhone: string;
  requestedEmail: string | null;
  requestedPhone: string | null;
  note: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export function AdminPanel() {
  const { t } = useLocale();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [donors, setDonors] = useState<AdminDonor[]>([]);
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [changeRequests, setChangeRequests] = useState<ContactChangeRequest[]>(
    [],
  );
  const [stats, setStats] = useState({
    totalDonors: 0,
    availableNow: 0,
    totalRequests: 0,
  });
  const [tab, setTab] = useState<"donors" | "settings">("donors");

  const [settingsUser, setSettingsUser] = useState("");
  const [privacyBn, setPrivacyBn] = useState("");
  const [privacyEn, setPrivacyEn] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyPhone, setVerifyPhone] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [tempCodes, setTempCodes] = useState("");
  const [settingsMsg, setSettingsMsg] = useState("");
  const [storageWarning, setStorageWarning] = useState("");

  async function loadStorageHealth() {
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const data = await res.json();
      const storage = data?.storage;
      if (!storage) return;
      if (storage.durable === false || storage.backend === "file") {
        setStorageWarning(
          storage.persistentHint ||
            "Storage is not durable. Link Railway Postgres (DATABASE_URL) or donor data will disappear when the website is edited/redeployed.",
        );
      } else {
        setStorageWarning("");
      }
    } catch {
      // ignore health fetch failures in the admin UI
    }
  }

  async function loadData() {
    const res = await fetch("/api/admin/donors");
    if (!res.ok) {
      setAuthed(false);
      return;
    }
    const data = await res.json();
    setDonors(data.donors);
    setRequests(data.contactRequests);
    setStats(data.stats);
    setAuthed(true);

    const changeRes = await fetch("/api/admin/contact-changes");
    if (changeRes.ok) {
      const changeData = await changeRes.json();
      setChangeRequests(changeData.requests || []);
    }
  }

  async function decideChange(id: string, decision: "approved" | "rejected") {
    const res = await fetch("/api/admin/contact-changes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, decision }),
    });
    if (res.ok) {
      await loadData();
      return;
    }
    const data = await res.json().catch(() => ({}));
    window.alert(data.error || t.errorGeneric);
  }

  async function loadSettings() {
    const res = await fetch("/api/admin/settings");
    if (!res.ok) return;
    const data = await res.json();
    setSettingsUser(data.username);
    setPrivacyBn(data.privacyBn);
    setPrivacyEn(data.privacyEn);
    setVerifyEmail(data.verifyEmail || "");
    setVerifyPhone(data.verifyPhone || "");
    setEmailVerified(Boolean(data.emailVerified));
    setPhoneVerified(Boolean(data.phoneVerified));
  }

  useEffect(() => {
    void loadStorageHealth();
    fetch("/api/admin/me")
      .then(async (res) => {
        if (!res.ok) {
          setAuthed(false);
          return;
        }
        await loadData();
        await loadSettings();
        await loadStorageHealth();
      })
      .catch(() => setAuthed(false))
      .finally(() => setChecking(false));
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errorGeneric);
        return;
      }
      await loadData();
      await loadSettings();
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
  }

  async function removeDonor(id: string) {
    if (!window.confirm("Delete this donor?")) return;
    const res = await fetch(`/api/admin/donors?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) await loadData();
  }

  async function savePrivacy() {
    setSettingsMsg("");
    const res = await fetch("/api/privacy", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ privacyBn, privacyEn }),
    });
    setSettingsMsg(res.ok ? t.saved : t.errorGeneric);
  }

  async function saveCredentials(e: React.FormEvent) {
    e.preventDefault();
    setSettingsMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "credentials",
        currentPassword,
        newUsername: newUsername || undefined,
        newPassword: newPassword || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSettingsMsg(data.error || t.errorGeneric);
      return;
    }
    setSettingsMsg(t.saved);
    setCurrentPassword("");
    setNewPassword("");
    await loadSettings();
  }

  async function setupVerify(e: React.FormEvent) {
    e.preventDefault();
    setSettingsMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "verify-setup",
        email: verifyEmail,
        phone: verifyPhone,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSettingsMsg(data.error || t.errorGeneric);
      return;
    }
    const bits = [];
    if (data.emailCode) bits.push(`Email code: ${data.emailCode}`);
    if (data.phoneCode) bits.push(`Phone code: ${data.phoneCode}`);
    setTempCodes(bits.join(" | "));
    setSettingsMsg(t.saved);
    await loadSettings();
  }

  async function confirmCode(channel: "email" | "phone") {
    const code = channel === "email" ? emailCode : phoneCode;
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify-code", channel, code }),
    });
    const data = await res.json();
    setSettingsMsg(res.ok ? t.saved : data.error || t.errorGeneric);
    await loadSettings();
  }

  if (checking) {
    return <p className="rounded-2xl bg-white/80 p-6">{t.loading}</p>;
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        {storageWarning ? (
          <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            <p className="font-semibold">User data can be erased</p>
            <p className="mt-1">{storageWarning}</p>
          </div>
        ) : null}
      <form
        onSubmit={login}
        className="space-y-3 rounded-2xl bg-white/80 p-6"
      >
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t.adminUsername}</span>
          <input
            className="field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t.adminPassword}</span>
          <input
            className="field"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error ? <p className="text-sm text-[var(--blood)]">{error}</p> : null}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? t.loading : t.adminLogin}
        </button>
      </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {storageWarning ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 px-5 py-4 text-sm text-red-800">
          <p className="font-semibold">
            Website edit/redeploy will erase donor data
          </p>
          <p className="mt-1">{storageWarning}</p>
          <p className="mt-2">
            Railway → Create PostgreSQL → bloodlink Variables → Add Reference →
            DATABASE_URL → Deploy. Then check{" "}
            <a className="underline" href="/api/health" target="_blank" rel="noreferrer">
              /api/health
            </a>{" "}
            for <code>backend: postgres</code>.
          </p>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/80 px-5 py-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={tab === "donors" ? "btn-primary" : "btn-ghost"}
            onClick={() => setTab("donors")}
          >
            {t.adminDonors}
          </button>
          <button
            type="button"
            className={tab === "settings" ? "btn-primary" : "btn-ghost"}
            onClick={() => setTab("settings")}
          >
            {t.adminSettings}
          </button>
        </div>
        <button type="button" className="btn-ghost" onClick={logout}>
          {t.logout}
        </button>
      </div>

      {tab === "donors" ? (
        <>
          <div className="flex flex-wrap gap-4 rounded-2xl bg-white/80 px-5 py-4 text-sm">
            <span>
              {t.totalDonors}: <strong>{stats.totalDonors}</strong>
            </span>
            <span>
              {t.availableNow}: <strong>{stats.availableNow}</strong>
            </span>
            <span>
              {t.adminRequests}: <strong>{stats.totalRequests}</strong>
            </span>
          </div>

          <section className="rounded-2xl bg-white/80 p-5">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
              {t.adminDonors}
            </h2>
            <ul className="mt-4 space-y-3">
              {donors.map((d) => (
                <li
                  key={d.id}
                  className="flex flex-col gap-2 border-b border-[var(--line)] pb-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="text-sm">
                    <p className="font-semibold">
                      {d.name} · {d.bloodGroup} ·{" "}
                      {d.gender === "female" ? t.female : t.male}
                    </p>
                    <p>
                      {d.phone} · {d.email}
                    </p>
                    <p>
                      {d.area}, {d.district} ·{" "}
                      {d.available ? t.available : t.unavailable}
                      {d.avgRating != null
                        ? ` · ★ ${d.avgRating} (${d.ratingCount})`
                        : ""}
                    </p>
                    <p>
                      {t.bloodIssue}: {d.bloodIssue || t.noBloodIssue}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-ghost text-[var(--blood)]"
                    onClick={() => removeDonor(d.id)}
                  >
                    {t.delete}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl bg-white/80 p-5">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
              {t.adminContactChanges}
            </h2>
            {!changeRequests.length ? (
              <p className="mt-3 text-sm text-[color-mix(in_oklab,var(--ink)_60%,white)]">
                {t.noChangeRequests}
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {changeRequests.map((r) => (
                  <li
                    key={r.id}
                    className="border-b border-[var(--line)] pb-3 text-sm"
                  >
                    <p className="font-semibold">
                      {r.donorName} · {r.status}
                    </p>
                    <p className="mt-1">
                      {t.email}: {r.currentEmail}
                      {r.requestedEmail ? ` → ${r.requestedEmail}` : ""}
                    </p>
                    <p className="mt-1">
                      {t.phone}: {r.currentPhone}
                      {r.requestedPhone ? ` → ${r.requestedPhone}` : ""}
                    </p>
                    {r.note ? <p className="mt-1">{r.note}</p> : null}
                    <p className="mt-1 text-xs opacity-70">
                      {new Date(r.createdAt).toLocaleString()}
                    </p>
                    {r.status === "pending" ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => decideChange(r.id, "approved")}
                        >
                          {t.accept}
                        </button>
                        <button
                          type="button"
                          className="btn-ghost text-[var(--blood)]"
                          onClick={() => decideChange(r.id, "rejected")}
                        >
                          {t.reject}
                        </button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl bg-white/80 p-5">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
              {t.adminRequests}
            </h2>
            <ul className="mt-4 space-y-3">
              {requests.map((r) => (
                <li key={r.id} className="border-b border-[var(--line)] pb-3 text-sm">
                  <p className="font-semibold">
                    {t.seekerContacted}: {r.seekerName} · {r.seekerPhone}
                  </p>
                  <p className="mt-1">
                    {t.contactedDonor}: {r.donorName} · {r.donorBloodGroup} ·{" "}
                    {r.donorPhone}
                  </p>
                  <p className="mt-1">
                    {r.donorArea}, {r.donorDistrict} · {r.hospital}
                  </p>
                  <p className="mt-1 text-xs opacity-70">
                    {new Date(r.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <div className="space-y-6">
          <section className="space-y-3 rounded-2xl bg-white/80 p-5">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
              {t.adminPrivacy}
            </h2>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Privacy (BN)</span>
              <textarea
                className="field min-h-40"
                value={privacyBn}
                onChange={(e) => setPrivacyBn(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Privacy (EN)</span>
              <textarea
                className="field min-h-40"
                value={privacyEn}
                onChange={(e) => setPrivacyEn(e.target.value)}
              />
            </label>
            <button type="button" className="btn-primary" onClick={savePrivacy}>
              {t.saveChanges}
            </button>
          </section>

          <section className="rounded-2xl bg-white/80 p-5">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
              {t.changeCredentials}
            </h2>
            <p className="mt-1 text-sm">
              {t.adminUsername}: <strong>{settingsUser}</strong>
            </p>
            <form onSubmit={saveCredentials} className="mt-3 space-y-3">
              <input
                className="field"
                type="password"
                placeholder={t.currentPassword}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <input
                className="field"
                placeholder={t.newUsername}
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
              <input
                className="field"
                type="password"
                placeholder={t.newPassword}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button type="submit" className="btn-primary">
                {t.saveChanges}
              </button>
            </form>
          </section>

          <section className="rounded-2xl bg-white/80 p-5">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
              {t.verifyContacts}
            </h2>
            <p className="mt-1 text-sm">
              Email: {emailVerified ? t.verified : t.notVerified} · Phone:{" "}
              {phoneVerified ? t.verified : t.notVerified}
            </p>
            <form onSubmit={setupVerify} className="mt-3 space-y-3">
              <input
                className="field"
                type="email"
                placeholder={t.verifyEmail}
                value={verifyEmail}
                onChange={(e) => setVerifyEmail(e.target.value)}
              />
              <input
                className="field"
                placeholder={t.verifyPhone}
                value={verifyPhone}
                onChange={(e) => setVerifyPhone(e.target.value)}
              />
              <button type="submit" className="btn-primary">
                {t.sendCodes}
              </button>
            </form>
            {tempCodes ? (
              <p className="mt-2 text-xs text-[var(--blood-deep)]">{tempCodes}</p>
            ) : null}
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <input
                  className="field"
                  placeholder={`Email ${t.enterCode}`}
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-ghost w-full"
                  onClick={() => confirmCode("email")}
                >
                  {t.verify} email
                </button>
              </div>
              <div className="space-y-2">
                <input
                  className="field"
                  placeholder={`Phone ${t.enterCode}`}
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-ghost w-full"
                  onClick={() => confirmCode("phone")}
                >
                  {t.verify} phone
                </button>
              </div>
            </div>
          </section>

          {settingsMsg ? (
            <p className="text-sm text-[var(--sage)]">{settingsMsg}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

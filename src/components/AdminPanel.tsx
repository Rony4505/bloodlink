"use client";

import { useEffect, useState } from "react";
import { PasswordField } from "@/components/PasswordField";
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
  const [databaseUrl, setDatabaseUrl] = useState("");
  const [storageReady, setStorageReady] = useState(false);
  const [storageBackend, setStorageBackend] = useState("file");
  const [storageSaving, setStorageSaving] = useState(false);
  const [platformOptions, setPlatformOptions] = useState({
    hospitalAccess: { enabled: false, notes: "" },
    orgAds: { enabled: false, notes: "" },
    futureServices: { enabled: false, notes: "" },
  });
  const [banners, setBanners] = useState<
    { id: string; title: string; imageUrl: string; linkUrl: string; enabled: boolean }[]
  >([]);
  const [bannerDraft, setBannerDraft] = useState({
    title: "",
    imageUrl: "",
    linkUrl: "",
  });

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
    if (data.platformOptions) {
      setPlatformOptions({
        hospitalAccess: {
          enabled: Boolean(data.platformOptions.hospitalAccess?.enabled),
          notes: data.platformOptions.hospitalAccess?.notes || "",
        },
        orgAds: {
          enabled: Boolean(data.platformOptions.orgAds?.enabled),
          notes: data.platformOptions.orgAds?.notes || "",
        },
        futureServices: {
          enabled: Boolean(data.platformOptions.futureServices?.enabled),
          notes: data.platformOptions.futureServices?.notes || "",
        },
      });
    }
    setBanners(Array.isArray(data.banners) ? data.banners : []);
  }

  async function saveBanners(
    next: {
      id: string;
      title: string;
      imageUrl: string;
      linkUrl: string;
      enabled: boolean;
    }[],
  ) {
    setSettingsMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "banners", banners: next }),
    });
    if (!res.ok) {
      setSettingsMsg(t.errorGeneric);
      return;
    }
    const data = await res.json();
    setBanners(data.banners || next);
    setSettingsMsg(t.saved);
  }

  async function addBanner(e: React.FormEvent) {
    e.preventDefault();
    const title = bannerDraft.title.trim();
    if (!title) return;
    const next = [
      ...banners,
      {
        id: crypto.randomUUID(),
        title,
        imageUrl: bannerDraft.imageUrl.trim(),
        linkUrl: bannerDraft.linkUrl.trim(),
        enabled: true,
      },
    ];
    setBannerDraft({ title: "", imageUrl: "", linkUrl: "" });
    setBanners(next);
    await saveBanners(next);
  }

  function printDonors() {
    const escapeHtml = (value: string) =>
      value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
    const rows = donors
      .map(
        (d, i) =>
          `<tr>
            <td>${i + 1}</td>
            <td>${escapeHtml(d.name)}</td>
            <td>${escapeHtml(d.bloodGroup)}</td>
            <td>${escapeHtml(d.gender)}</td>
            <td>${escapeHtml(d.phone)}</td>
            <td>${escapeHtml(d.email)}</td>
            <td>${escapeHtml(d.district)}</td>
            <td>${escapeHtml(d.area)}</td>
            <td>${d.available ? "Yes" : "No"}</td>
            <td>${escapeHtml(d.lastDonationDate || "-")}</td>
          </tr>`,
      )
      .join("");
    const html = `<!doctype html>
<html><head><meta charset="utf-8" /><title>BloodLink Donors</title>
<style>
  body{font-family:Arial,sans-serif;padding:24px;color:#111}
  h1{margin:0 0 4px;font-size:20px}
  p{margin:0 0 16px;font-size:12px;color:#444}
  table{border-collapse:collapse;width:100%;font-size:11px}
  th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;vertical-align:top}
  th{background:#f3f3f3}
  @media print{button{display:none}}
</style></head><body>
  <h1>BloodLink — Donor registry</h1>
  <p>Generated ${new Date().toLocaleString()} · Total ${donors.length} · For authorized government use</p>
  <table>
    <thead><tr>
      <th>#</th><th>Name</th><th>Blood</th><th>Gender</th><th>Phone</th>
      <th>Email</th><th>District</th><th>Area</th><th>Available</th><th>Last donation</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <script>window.onload=()=>window.print()</script>
</body></html>`;
    const win = window.open("", "_blank");
    if (!win) {
      window.alert(t.errorGeneric);
      return;
    }
    win.document.write(html);
    win.document.close();
  }

  async function savePlatformOptions(e: React.FormEvent) {
    e.preventDefault();
    setSettingsMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "platform-options",
        platformOptions,
      }),
    });
    setSettingsMsg(res.ok ? t.saved : t.errorGeneric);
  }

  async function loadStorage() {
    const res = await fetch("/api/admin/storage");
    if (!res.ok) return;
    const data = await res.json();
    setStorageReady(Boolean(data.databaseReady));
    setStorageBackend(data.storage?.backend || "file");
  }

  async function saveStorage(e: React.FormEvent) {
    e.preventDefault();
    setStorageSaving(true);
    setSettingsMsg("");
    try {
      const res = await fetch("/api/admin/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ databaseUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSettingsMsg(data.error || t.errorGeneric);
        setStorageReady(false);
        return;
      }
      setStorageReady(Boolean(data.databaseReady));
      setStorageBackend(data.storage?.backend || "postgres");
      setDatabaseUrl("");
      setSettingsMsg(t.storageReady);
      await loadData();
    } catch {
      setSettingsMsg(t.errorGeneric);
    } finally {
      setStorageSaving(false);
    }
  }

  useEffect(() => {
    fetch("/api/admin/me")
      .then(async (res) => {
        if (!res.ok) {
          setAuthed(false);
          return;
        }
        await loadData();
        await loadSettings();
        await loadStorage();
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
      await loadStorage();
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
      <form
        onSubmit={login}
        className="mx-auto max-w-md space-y-3 rounded-2xl bg-white/80 p-6"
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
        <PasswordField
          id="admin-login-password"
          label={t.adminPassword}
          value={password}
          onChange={setPassword}
          required
          autoComplete="current-password"
        />
        {error ? <p className="text-sm text-[var(--blood)]">{error}</p> : null}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? t.loading : t.adminLogin}
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-6">
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
          <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-white/80 px-5 py-4 text-sm">
            <span>
              {t.totalDonors}: <strong>{stats.totalDonors}</strong>
            </span>
            <span>
              {t.availableNow}: <strong>{stats.availableNow}</strong>
            </span>
            <span>
              {t.adminRequests}: <strong>{stats.totalRequests}</strong>
            </span>
            <button
              type="button"
              className="btn-ghost ml-auto"
              onClick={printDonors}
            >
              {t.printPdf}
            </button>
          </div>

          <section className="rounded-2xl bg-white/80 p-5 print:shadow-none">
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
          <section className="space-y-3 rounded-2xl border border-[var(--line)] bg-[linear-gradient(165deg,#fff8f4_0%,var(--mist)_50%,#f3ebe4_100%)] p-5">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--blood-deep)]">
              {t.storageSetup}
            </h2>
            <p className="text-sm leading-relaxed text-[color-mix(in_oklab,var(--ink)_72%,white)]">
              {t.storageSetupBody}
            </p>
            <p
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                storageReady
                  ? "bg-[color-mix(in_oklab,var(--sage)_14%,white)] text-[var(--sage)]"
                  : "bg-[color-mix(in_oklab,var(--blood)_12%,white)] text-[var(--blood-deep)]"
              }`}
            >
              {storageReady ? t.storageReady : t.storageNotReady}
              {" · "}
              backend: {storageBackend}
            </p>
            <p className="text-xs leading-relaxed text-[color-mix(in_oklab,var(--ink)_60%,white)]">
              {t.storageVolumeTip}
            </p>
            <form onSubmit={saveStorage} className="space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">{t.storageUrlLabel}</span>
                <input
                  className="field"
                  type="password"
                  autoComplete="off"
                  placeholder="postgresql://..."
                  value={databaseUrl}
                  onChange={(e) => setDatabaseUrl(e.target.value)}
                  required
                />
                <span className="mt-1 block text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                  {t.storageUrlHint}
                </span>
              </label>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-full bg-[#2f6b4f] px-5 py-3 font-semibold text-white transition hover:bg-[#265a42] disabled:opacity-55"
                disabled={storageSaving}
              >
                {storageSaving ? t.loading : t.storageSave}
              </button>
            </form>
          </section>

          <section className="space-y-3 rounded-2xl bg-white/80 p-5">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
              {t.futureFeatures}
            </h2>
            <p className="text-sm leading-relaxed text-[color-mix(in_oklab,var(--ink)_70%,white)]">
              {t.futureFeaturesBody}
            </p>
            <form onSubmit={savePlatformOptions} className="mt-2 space-y-5">
              {(
                [
                  ["hospitalAccess", t.hospitalAccess, t.hospitalAccessHint],
                  ["orgAds", t.orgAds, t.orgAdsHint],
                  ["futureServices", t.futureServices, t.futureServicesHint],
                ] as const
              ).map(([key, title, hint]) => (
                <div
                  key={key}
                  className="rounded-xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--sand)_20%,white)] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{title}</p>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={platformOptions[key].enabled}
                        onChange={(e) =>
                          setPlatformOptions((prev) => ({
                            ...prev,
                            [key]: { ...prev[key], enabled: e.target.checked },
                          }))
                        }
                      />
                      {platformOptions[key].enabled
                        ? t.featureEnabled
                        : t.featureDisabled}
                    </label>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[color-mix(in_oklab,var(--ink)_60%,white)]">
                    {hint}
                  </p>
                  <label className="mt-3 block text-sm">
                    <span className="mb-1 block font-medium">{t.featureNotes}</span>
                    <textarea
                      className="field min-h-16"
                      value={platformOptions[key].notes}
                      onChange={(e) =>
                        setPlatformOptions((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], notes: e.target.value },
                        }))
                      }
                    />
                  </label>
                </div>
              ))}
              <button type="submit" className="btn-primary">
                {t.saveChanges}
              </button>
            </form>
          </section>

          <section className="space-y-3 rounded-2xl bg-white/80 p-5">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
              {t.orgBanners}
            </h2>
            <p className="text-sm text-[color-mix(in_oklab,var(--ink)_70%,white)]">
              {t.orgBannersHint}
            </p>
            <form onSubmit={addBanner} className="grid gap-3 md:grid-cols-3">
              <input
                className="field"
                placeholder={t.bannerTitle}
                value={bannerDraft.title}
                onChange={(e) =>
                  setBannerDraft((d) => ({ ...d, title: e.target.value }))
                }
                required
              />
              <input
                className="field"
                placeholder={t.bannerImage}
                value={bannerDraft.imageUrl}
                onChange={(e) =>
                  setBannerDraft((d) => ({ ...d, imageUrl: e.target.value }))
                }
              />
              <input
                className="field"
                placeholder={t.bannerLink}
                value={bannerDraft.linkUrl}
                onChange={(e) =>
                  setBannerDraft((d) => ({ ...d, linkUrl: e.target.value }))
                }
              />
              <button type="submit" className="btn-primary md:col-span-3">
                {t.addBanner}
              </button>
            </form>
            <ul className="space-y-2">
              {banners.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line)] px-3 py-2 text-sm"
                >
                  <span className="font-medium">{b.title}</span>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={b.enabled}
                        onChange={(e) => {
                          const next = banners.map((x) =>
                            x.id === b.id
                              ? { ...x, enabled: e.target.checked }
                              : x,
                          );
                          setBanners(next);
                          void saveBanners(next);
                        }}
                      />
                      {b.enabled ? t.featureEnabled : t.featureDisabled}
                    </label>
                    <button
                      type="button"
                      className="btn-ghost text-[var(--blood)]"
                      onClick={() => {
                        const next = banners.filter((x) => x.id !== b.id);
                        setBanners(next);
                        void saveBanners(next);
                      }}
                    >
                      {t.delete}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

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
              <PasswordField
                id="admin-current-password"
                label={t.currentPassword}
                value={currentPassword}
                onChange={setCurrentPassword}
                required
                autoComplete="current-password"
              />
              <input
                className="field"
                placeholder={t.newUsername}
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
              <PasswordField
                id="admin-new-password"
                label={t.newPassword}
                value={newPassword}
                onChange={setNewPassword}
                autoComplete="new-password"
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

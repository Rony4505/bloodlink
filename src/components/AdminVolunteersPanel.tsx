"use client";

import { useEffect, useState } from "react";
import { DISTRICTS } from "@/lib/districts";
import { useLocale } from "@/lib/i18n/locale-context";

type Activity = {
  id: string;
  volunteerId: string;
  title: string;
  description: string;
  activityType: string;
  status: "planned" | "in_progress" | "done";
  activityDate: string;
  volunteerNote?: string;
};

type VolunteerRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  district: string;
  role: string;
  notes: string;
  username: string;
  hasLogin: boolean;
  enabled: boolean;
  activityCount: number;
  doneCount: number;
  inProgressCount: number;
  activities: Activity[];
};

const emptyVolunteer = {
  name: "",
  phone: "",
  email: "",
  district: "Dhaka",
  role: "",
  notes: "",
  username: "",
  password: "",
};

const emptyActivity: {
  title: string;
  description: string;
  activityType: string;
  status: Activity["status"];
  activityDate: string;
} = {
  title: "",
  description: "",
  activityType: "donor_add",
  status: "planned",
  activityDate: "",
};

export function AdminVolunteersPanel() {
  const { t } = useLocale();
  const [volunteers, setVolunteers] = useState<VolunteerRow[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, activities: 0 });
  const [draft, setDraft] = useState(emptyVolunteer);
  const [activityDraft, setActivityDraft] = useState(emptyActivity);
  const [selectedId, setSelectedId] = useState<string>("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [portalUrl, setPortalUrl] = useState("https://bloodlinkbd.org/volunteer/login");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const configured = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
    const origin = configured || window.location.origin.replace(/\/$/, "");
    setPortalUrl(`${origin}/volunteer/login`);
  }, []);

  async function load() {
    const res = await fetch("/api/admin/volunteers");
    if (!res.ok) return;
    const data = await res.json();
    setVolunteers(data.volunteers || []);
    setStats(data.stats || { total: 0, active: 0, activities: 0 });
  }

  useEffect(() => {
    void load();
  }, []);

  async function copyPortalUrl() {
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      setMessage(t.volunteerUrlCopied);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t.volunteerCopyUrl, portalUrl);
    }
  }

  async function addVolunteer(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/volunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "volunteer", ...draft }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errorGeneric);
        return;
      }
      setDraft(emptyVolunteer);
      await load();
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  async function toggleEnabled(v: VolunteerRow) {
    await fetch("/api/admin/volunteers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "volunteer", id: v.id, enabled: !v.enabled }),
    });
    await load();
  }

  async function resetPassword(v: VolunteerRow) {
    const password = window.prompt(t.volunteerResetPasswordPrompt, "");
    if (!password) return;
    if (password.length < 6) {
      setError(t.volunteerPasswordShort);
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/volunteers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "volunteer", id: v.id, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errorGeneric);
        return;
      }
      setMessage(t.volunteerPasswordChanged);
      await load();
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  async function changeUsername(v: VolunteerRow) {
    const next = window.prompt(t.volunteerChangeUsernamePrompt, v.username || "");
    if (next == null) return;
    const username = next.trim().toLowerCase();
    if (username.length < 3) {
      setError(t.volunteerUsernameShort);
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/volunteers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "volunteer", id: v.id, username }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          String(data.error || "").includes("taken")
            ? t.volunteerUsernameTaken
            : data.error || t.errorGeneric,
        );
        return;
      }
      setMessage(t.volunteerUsernameChanged);
      await load();
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  async function removeVolunteer(id: string) {
    if (!window.confirm(t.volunteerDeleteConfirm)) return;
    await fetch(`/api/admin/volunteers?kind=volunteer&id=${id}`, {
      method: "DELETE",
    });
    if (selectedId === id) setSelectedId("");
    await load();
  }

  async function addActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) {
      setError(t.volunteerSelectFirst);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/volunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "activity",
          volunteerId: selectedId,
          ...activityDraft,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errorGeneric);
        return;
      }
      setActivityDraft(emptyActivity);
      setExpandedId(selectedId);
      await load();
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  async function setActivityStatus(id: string, status: Activity["status"]) {
    await fetch("/api/admin/volunteers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "activity", id, status }),
    });
    await load();
  }

  async function removeActivity(id: string) {
    await fetch(`/api/admin/volunteers?kind=activity&id=${id}`, {
      method: "DELETE",
    });
    await load();
  }

  function statusLabel(status: Activity["status"]) {
    if (status === "done") return t.volunteerStatusDone;
    if (status === "in_progress") return t.volunteerStatusProgress;
    return t.volunteerStatusPlanned;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[color-mix(in_oklab,#2f6b4f_35%,white)] bg-[color-mix(in_oklab,#2f6b4f_8%,white)] px-5 py-4">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--blood-deep)]">
          {t.volunteerPortalUrlTitle}
        </h2>
        <p className="mt-1 text-sm text-[color-mix(in_oklab,var(--ink)_70%,white)]">
          {t.volunteerPortalUrlHint}
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            className="field flex-1 font-mono text-sm"
            readOnly
            value={portalUrl}
            onFocus={(e) => e.currentTarget.select()}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={() => void copyPortalUrl()}
            >
              {copied ? t.volunteerUrlCopied : t.volunteerCopyUrl}
            </button>
            <a
              href={portalUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost inline-flex items-center"
            >
              {t.volunteerOpenUrl}
            </a>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-white/80 px-5 py-4 text-sm">
        <span>
          {t.volunteerTotal}: <strong>{stats.total}</strong>
        </span>
        <span>
          {t.volunteerActive}: <strong>{stats.active}</strong>
        </span>
        <span>
          {t.volunteerActivities}: <strong>{stats.activities}</strong>
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={addVolunteer} className="space-y-3 rounded-2xl bg-white/80 p-5">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
            {t.volunteerAdd}
          </h2>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t.name}</span>
            <input
              className="field"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t.volunteerRole}</span>
            <input
              className="field"
              value={draft.role}
              onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
              placeholder={t.volunteerRoleHint}
              required
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t.volunteerUsername}</span>
              <input
                className="field"
                value={draft.username}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, username: e.target.value }))
                }
                placeholder="volunteer1"
                required
                autoComplete="off"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t.password}</span>
              <input
                className="field"
                type="password"
                value={draft.password}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, password: e.target.value }))
                }
                required
                minLength={6}
                autoComplete="new-password"
              />
            </label>
          </div>
          <p className="text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
            {t.volunteerCredHint}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t.phone}</span>
              <input
                className="field"
                value={draft.phone}
                onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                placeholder="01XXXXXXXXX"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t.email}</span>
              <input
                className="field"
                type="email"
                value={draft.email}
                onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t.district}</span>
            <select
              className="field"
              value={draft.district}
              onChange={(e) => setDraft((d) => ({ ...d, district: e.target.value }))}
            >
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t.volunteerNotes}</span>
            <textarea
              className="field min-h-20"
              value={draft.notes}
              onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
            />
          </label>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? t.loading : t.volunteerAdd}
          </button>
        </form>

        <form onSubmit={addActivity} className="space-y-3 rounded-2xl bg-white/80 p-5">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
            {t.volunteerLogWork}
          </h2>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t.volunteer}</span>
            <select
              className="field"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              required
            >
              <option value="">{t.volunteerSelect}</option>
              {volunteers.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} · {v.role}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t.volunteerWorkTitle}</span>
            <input
              className="field"
              value={activityDraft.title}
              onChange={(e) =>
                setActivityDraft((d) => ({ ...d, title: e.target.value }))
              }
              required
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t.volunteerWorkType}</span>
              <select
                className="field"
                value={activityDraft.activityType}
                onChange={(e) =>
                  setActivityDraft((d) => ({ ...d, activityType: e.target.value }))
                }
              >
                <optgroup label={t.volunteerCatEmergency}>
                  <option value="emergency_blood">{t.volunteerTypeEmergencyBlood}</option>
                  <option value="critical_patient">{t.volunteerTypeCriticalPatient}</option>
                  <option value="accident_response">{t.volunteerTypeAccident}</option>
                  <option value="disaster_relief">{t.volunteerTypeDisaster}</option>
                  <option value="mother_child">{t.volunteerTypeMotherChild}</option>
                  <option value="night_duty">{t.volunteerTypeNightDuty}</option>
                  <option value="plasma_seek">{t.volunteerTypePlasma}</option>
                </optgroup>
                <optgroup label={t.volunteerCatHumanitarian}>
                  <option value="hospital_liaison">{t.volunteerTypeHospital}</option>
                  <option value="blood_camp">{t.volunteerTypeCamp}</option>
                  <option value="thalassemia_support">{t.volunteerTypeThalassemia}</option>
                  <option value="transport_help">{t.volunteerTypeTransport}</option>
                  <option value="call_center">{t.volunteerTypeCallCenter}</option>
                </optgroup>
                <optgroup label={t.volunteerCatData}>
                  <option value="donor_add">{t.volunteerTypeDonorAdd}</option>
                  <option value="donor_verify">{t.volunteerTypeDonorVerify}</option>
                  <option value="data_entry">{t.volunteerTypeData}</option>
                </optgroup>
                <optgroup label={t.volunteerCatOutreach}>
                  <option value="community_outreach">{t.volunteerTypeOutreach}</option>
                  <option value="awareness_camp">{t.volunteerTypeAwareness}</option>
                  <option value="social_media">{t.volunteerTypeSocial}</option>
                </optgroup>
                <optgroup label={t.volunteerCatOther}>
                  <option value="other">{t.volunteerTypeOther}</option>
                </optgroup>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t.volunteerWorkDate}</span>
              <input
                className="field"
                type="date"
                value={activityDraft.activityDate}
                onChange={(e) =>
                  setActivityDraft((d) => ({ ...d, activityDate: e.target.value }))
                }
                required
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t.volunteerWorkStatus}</span>
            <select
              className="field"
              value={activityDraft.status}
              onChange={(e) =>
                setActivityDraft((d) => ({
                  ...d,
                  status: e.target.value as Activity["status"],
                }))
              }
            >
              <option value="planned">{t.volunteerStatusPlanned}</option>
              <option value="in_progress">{t.volunteerStatusProgress}</option>
              <option value="done">{t.volunteerStatusDone}</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t.volunteerWorkDetail}</span>
            <textarea
              className="field min-h-20"
              value={activityDraft.description}
              onChange={(e) =>
                setActivityDraft((d) => ({ ...d, description: e.target.value }))
              }
            />
          </label>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? t.loading : t.volunteerLogWork}
          </button>
        </form>
      </div>

      {error ? <p className="text-sm text-[var(--blood)]">{error}</p> : null}
      {message ? <p className="text-sm text-[#245a40]">{message}</p> : null}

      <section className="rounded-2xl bg-white/80 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
          {t.volunteerList}
        </h2>
        {!volunteers.length ? (
          <p className="mt-3 text-sm text-[color-mix(in_oklab,var(--ink)_60%,white)]">
            {t.volunteerEmpty}
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {volunteers.map((v) => (
              <li key={v.id} className="rounded-xl border border-[var(--line)] px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="text-sm">
                    <p className="font-semibold">
                      {v.name} · {v.role}
                      {!v.enabled ? (
                        <span className="ml-2 text-xs text-[color-mix(in_oklab,var(--ink)_50%,white)]">
                          ({t.volunteerInactive})
                        </span>
                      ) : null}
                    </p>
                    <p>
                      {v.username
                        ? `${t.volunteerUsername}: ${v.username}`
                        : t.volunteerNoLogin}
                      {v.district ? ` · ${v.district}` : ""}
                      {v.phone ? ` · ${v.phone}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-[color-mix(in_oklab,var(--ink)_60%,white)]">
                      {t.volunteerWorkSummary
                        .replace("{total}", String(v.activityCount))
                        .replace("{done}", String(v.doneCount))
                        .replace("{progress}", String(v.inProgressCount))}
                    </p>
                    {v.notes ? <p className="mt-1 text-xs">{v.notes}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-ghost text-xs"
                      onClick={() =>
                        setExpandedId(expandedId === v.id ? null : v.id)
                      }
                    >
                      {expandedId === v.id
                        ? t.volunteerHideWork
                        : t.volunteerShowWork}
                    </button>
                    <button
                      type="button"
                      className="btn-ghost text-xs"
                      onClick={() => void toggleEnabled(v)}
                    >
                      {v.enabled ? t.volunteerDisable : t.volunteerEnable}
                    </button>
                    <button
                      type="button"
                      className="btn-ghost text-xs"
                      onClick={() => void changeUsername(v)}
                    >
                      {t.volunteerChangeUsername}
                    </button>
                    <button
                      type="button"
                      className="btn-ghost text-xs"
                      onClick={() => void resetPassword(v)}
                    >
                      {t.volunteerResetPassword}
                    </button>
                    <button
                      type="button"
                      className="btn-ghost text-xs text-[var(--blood)]"
                      onClick={() => void removeVolunteer(v.id)}
                    >
                      {t.delete}
                    </button>
                  </div>
                </div>

                {expandedId === v.id ? (
                  <ul className="mt-3 space-y-2 border-t border-[var(--line)] pt-3">
                    {!v.activities.length ? (
                      <li className="text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                        {t.volunteerNoWork}
                      </li>
                    ) : (
                      v.activities.map((a) => (
                        <li
                          key={a.id}
                          className="rounded-lg bg-[color-mix(in_oklab,var(--sand)_35%,white)] px-3 py-2 text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-semibold">
                              {a.title} · {statusLabel(a.status)} · {a.activityDate}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {(["planned", "in_progress", "done"] as const).map(
                                (s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    className="rounded-full border border-[var(--line)] bg-white px-2 py-0.5"
                                    onClick={() => void setActivityStatus(a.id, s)}
                                  >
                                    {statusLabel(s)}
                                  </button>
                                ),
                              )}
                              <button
                                type="button"
                                className="text-[var(--blood)] underline"
                                onClick={() => void removeActivity(a.id)}
                              >
                                {t.delete}
                              </button>
                            </div>
                          </div>
                          <p className="mt-1 opacity-80">
                            {a.activityType}
                            {a.description ? ` — ${a.description}` : ""}
                          </p>
                          {a.volunteerNote ? (
                            <p className="mt-1 text-[11px] text-[color-mix(in_oklab,#2f6b4f_80%,black)]">
                              {t.volunteerProgressNote}: {a.volunteerNote}
                            </p>
                          ) : null}
                        </li>
                      ))
                    )}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

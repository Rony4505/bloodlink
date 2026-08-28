"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminVolunteerDetailPanel } from "@/components/AdminVolunteerDetailPanel";
import { VolunteerVerbalUrlCard } from "@/components/VolunteerVerbalUrlCard";
import { DISTRICTS } from "@/lib/districts";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  VOLUNTEER_TASK_TYPES,
  getVolunteerTaskType,
  type VolunteerTaskCategory,
} from "@/lib/volunteer-tasks";

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
  linkToken: string;
  notificationsEnabled: boolean;
  activityCount: number;
  doneCount: number;
  inProgressCount: number;
  activities: Activity[];
};

type Tab = "add" | "work" | "team";

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

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

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
  activityDate: todayIso(),
};

const CATEGORY_ORDER: VolunteerTaskCategory[] = [
  "emergency",
  "humanitarian",
  "data",
  "outreach",
  "other",
];

export function AdminVolunteersPanel() {
  const { t } = useLocale();
  const [tab, setTab] = useState<Tab>("add");
  const [volunteers, setVolunteers] = useState<VolunteerRow[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, activities: 0 });
  const [draft, setDraft] = useState(emptyVolunteer);
  const [showExtra, setShowExtra] = useState(false);
  const [activityDraft, setActivityDraft] = useState(emptyActivity);
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [portalUrl, setPortalUrl] = useState(
    "https://bloodlinkbd.org/volunteer/login",
  );
  const [donorStats, setDonorStats] = useState<
    Record<
      string,
      {
        totalDonors: number;
        approvedDonors: number;
        pendingManual: number;
        linkDonors: number;
      }
    >
  >({});
  const [pendingDonors, setPendingDonors] = useState<
    {
      id: string;
      name: string;
      bloodGroup: string;
      district: string;
      area: string;
      createdAt: string;
      volunteerName: string;
    }[]
  >([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [notifyTarget, setNotifyTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [notifyTitle, setNotifyTitle] = useState("BloodLink BD");
  const [notifyBody, setNotifyBody] = useState("");

  const taskGroups = useMemo(() => {
    const groups: Record<VolunteerTaskCategory, typeof VOLUNTEER_TASK_TYPES> = {
      emergency: [],
      humanitarian: [],
      data: [],
      outreach: [],
      other: [],
    };
    for (const item of VOLUNTEER_TASK_TYPES) {
      groups[item.category].push(item);
    }
    return groups;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const configured = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(
      /\/$/,
      "",
    );
    const origin = configured || window.location.origin.replace(/\/$/, "");
    setPortalUrl(origin);
  }, []);

  async function loadPendingDonors() {
    const res = await fetch("/api/admin/volunteer-donors");
    if (!res.ok) return;
    const data = await res.json();
    setPendingDonors(data.pending || []);
  }

  async function approveDonor(donorId: string, approved: boolean) {
    await fetch("/api/admin/volunteer-donors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ donorId, approved }),
    });
    await Promise.all([load(), loadPendingDonors()]);
    setMessage(approved ? t.volunteerDonorApproved : t.volunteerDonorRejected);
  }

  async function submitNotify() {
    if (!notifyTarget || !notifyTitle.trim() || !notifyBody.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/volunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "notify",
          volunteerId: notifyTarget.id,
          title: notifyTitle.trim(),
          body: notifyBody.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errorGeneric);
        return;
      }
      const sent = data.push?.sent ?? 0;
      const total = data.targetCount ?? 1;
      setMessage(
        notifyTarget.id === "all"
          ? t.volunteerNotifyBroadcastOk.replace("{sent}", String(sent)).replace("{total}", String(total))
          : t.volunteerNotifySent,
      );
      setNotifyTarget(null);
      setNotifyBody("");
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  function openNotifyModal(id: string, name: string) {
    setNotifyTarget({ id, name });
    setNotifyTitle("BloodLink BD");
    setNotifyBody("");
    setMenuId(null);
  }

  async function load() {
    const res = await fetch("/api/admin/volunteers");
    if (!res.ok) return;
    const data = await res.json();
    setVolunteers(data.volunteers || []);
    const map: typeof donorStats = {};
    for (const row of data.donorStats || []) {
      map[row.volunteerId] = row;
    }
    setDonorStats(map);
    setStats(data.stats || { total: 0, active: 0, activities: 0 });
  }

  useEffect(() => {
    void load();
    void loadPendingDonors();
  }, []);

  function typeLabel(type: string) {
    const key = getVolunteerTaskType(type).labelKey as keyof typeof t;
    return (t[key] as string) || type;
  }

  function categoryTitle(cat: VolunteerTaskCategory) {
    if (cat === "emergency") return t.volunteerCatEmergency;
    if (cat === "humanitarian") return t.volunteerCatHumanitarian;
    if (cat === "data") return t.volunteerCatData;
    if (cat === "outreach") return t.volunteerCatOutreach;
    return t.volunteerCatOther;
  }

  function statusLabel(status: Activity["status"]) {
    if (status === "done") return t.volunteerStatusDone;
    if (status === "in_progress") return t.volunteerStatusProgress;
    return t.volunteerStatusPlanned;
  }

  function suggestUsername(name: string) {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 16);
  }

  async function addVolunteer(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
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
      setShowExtra(false);
      setMessage(t.volunteerAddedOk);
      await load();
      setTab("work");
      if (data.volunteer?.id) setSelectedId(data.volunteer.id);
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  async function toggleEnabled(v: VolunteerRow) {
    setMenuId(null);
    await fetch("/api/admin/volunteers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "volunteer", id: v.id, enabled: !v.enabled }),
    });
    await load();
  }

  async function resetPassword(v: VolunteerRow) {
    setMenuId(null);
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
    setMenuId(null);
    const next = window.prompt(
      t.volunteerChangeUsernamePrompt,
      v.username || "",
    );
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
    setMenuId(null);
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
    setMessage("");
    try {
      const title =
        activityDraft.title.trim() || typeLabel(activityDraft.activityType);
      const res = await fetch("/api/admin/volunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "activity",
          volunteerId: selectedId,
          ...activityDraft,
          title,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errorGeneric);
        return;
      }
      setActivityDraft({ ...emptyActivity, activityDate: todayIso() });
      setExpandedId(selectedId);
      setMessage(t.volunteerWorkAssignedOk);
      await load();
      setTab("team");
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

  const tabs: { id: Tab; label: string }[] = [
    { id: "add", label: t.volunteerTabAdd },
    { id: "work", label: t.volunteerTabWork },
    { id: "team", label: t.volunteerTabTeam },
  ];

  return (
    <div className="space-y-4">
      {/* Personal URL info */}
      <div className="rounded-2xl bg-[color-mix(in_oklab,#6e1220_8%,white)] px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--blood-deep)]">
              {t.volunteerPersonalUrlsTitle}
            </p>
            <p className="mt-1 text-sm text-[color-mix(in_oklab,var(--ink)_65%,white)]">
              {t.volunteerPersonalUrlsHint}
            </p>
          </div>
          <button
            type="button"
            className="btn-primary px-3 py-1.5 text-xs"
            onClick={() => openNotifyModal("all", t.volunteerNotifyAllLabel)}
          >
            {t.volunteerNotifyAll}
          </button>
        </div>
      </div>

      {pendingDonors.length ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
          <h3 className="font-semibold text-amber-950">{t.volunteerPendingDonorsTitle}</h3>
          <ul className="mt-3 space-y-2">
            {pendingDonors.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{d.name} · {d.bloodGroup}</p>
                  <p className="text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                    {d.area}, {d.district} · {d.volunteerName}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-primary px-3 py-1 text-xs"
                    onClick={() => void approveDonor(d.id, true)}
                  >
                    {t.volunteerApproveDonor}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost px-3 py-1 text-xs"
                    onClick={() => void approveDonor(d.id, false)}
                  >
                    {t.reject}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Simple stats */}
      <p className="text-sm text-[color-mix(in_oklab,var(--ink)_65%,white)]">
        <span className="font-semibold text-[var(--ink)]">{stats.total}</span>{" "}
        {t.volunteerTotal.toLowerCase()}
        <span className="mx-2 opacity-40">·</span>
        <span className="font-semibold text-[var(--ink)]">{stats.active}</span>{" "}
        {t.volunteerActive.toLowerCase()}
        <span className="mx-2 opacity-40">·</span>
        <span className="font-semibold text-[var(--ink)]">
          {stats.activities}
        </span>{" "}
        {t.volunteerActivities.toLowerCase()}
      </p>

      {/* Tabs */}
      <div className="flex gap-1 rounded-full bg-[color-mix(in_oklab,var(--sand)_55%,white)] p-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTab(item.id);
              setError("");
            }}
            className={`flex-1 rounded-full px-3 py-2.5 text-sm font-semibold transition ${
              tab === item.id
                ? "bg-[var(--blood-deep)] text-white shadow-sm"
                : "text-[color-mix(in_oklab,var(--ink)_70%,white)] hover:bg-white/70"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-[var(--blood)]">{error}</p> : null}
      {message ? <p className="text-sm text-[#245a40]">{message}</p> : null}

      {/* Tab: Add */}
      {tab === "add" ? (
        <form
          onSubmit={addVolunteer}
          className="mx-auto max-w-lg space-y-4 rounded-2xl bg-white/90 p-5"
        >
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--blood-deep)]">
              {t.volunteerAdd}
            </h2>
            <p className="mt-1 text-sm text-[color-mix(in_oklab,var(--ink)_65%,white)]">
              {t.volunteerAddSimpleHint}
            </p>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t.name}</span>
            <input
              className="field"
              value={draft.name}
              onChange={(e) => {
                const name = e.target.value;
                setDraft((d) => ({
                  ...d,
                  name,
                  username: d.username || suggestUsername(name),
                }));
              }}
              required
              autoFocus
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
              <span className="mb-1 block font-medium">
                {t.volunteerUsername}{" "}
                <span className="font-normal opacity-60">({t.emailOptional})</span>
              </span>
              <input
                className="field"
                value={draft.username}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, username: e.target.value }))
                }
                autoComplete="off"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">
                {t.password}{" "}
                <span className="font-normal opacity-60">({t.emailOptional})</span>
              </span>
              <input
                className="field"
                type="text"
                value={draft.password}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, password: e.target.value }))
                }
                minLength={6}
                autoComplete="off"
              />
            </label>
          </div>

          <button
            type="button"
            className="text-sm font-semibold text-[var(--blood-deep)] underline-offset-2 hover:underline"
            onClick={() => setShowExtra((v) => !v)}
          >
            {showExtra ? t.volunteerHideDetails : t.volunteerMoreDetails}
          </button>

          {showExtra ? (
            <div className="space-y-3 rounded-xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--sand)_30%,white)] p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">{t.phone}</span>
                  <input
                    className="field"
                    value={draft.phone}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, phone: e.target.value }))
                    }
                    placeholder="01XXXXXXXXX"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">{t.district}</span>
                  <select
                    className="field"
                    value={draft.district}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, district: e.target.value }))
                    }
                  >
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">{t.email}</span>
                <input
                  className="field"
                  type="email"
                  value={draft.email}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, email: e.target.value }))
                  }
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">
                  {t.volunteerNotes}
                </span>
                <textarea
                  className="field min-h-16"
                  value={draft.notes}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, notes: e.target.value }))
                  }
                />
              </label>
            </div>
          ) : null}

          <p className="text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
            {t.volunteerCredHint}
          </p>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? t.loading : t.volunteerAdd}
          </button>
        </form>
      ) : null}

      {/* Tab: Assign work */}
      {tab === "work" ? (
        <form
          onSubmit={addActivity}
          className="mx-auto max-w-lg space-y-4 rounded-2xl bg-white/90 p-5"
        >
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--blood-deep)]">
              {t.volunteerLogWork}
            </h2>
            <p className="mt-1 text-sm text-[color-mix(in_oklab,var(--ink)_65%,white)]">
              {t.volunteerAssignHint}
            </p>
          </div>

          {!volunteers.length ? (
            <p className="text-sm text-[color-mix(in_oklab,var(--ink)_60%,white)]">
              {t.volunteerEmpty}
            </p>
          ) : (
            <>
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
                      {v.name}
                      {v.role ? ` — ${v.role}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium">
                  {t.volunteerWorkType}
                </span>
                <select
                  className="field"
                  value={activityDraft.activityType}
                  onChange={(e) => {
                    const activityType = e.target.value;
                    setActivityDraft((d) => ({
                      ...d,
                      activityType,
                      title: d.title.trim()
                        ? d.title
                        : typeLabel(activityType),
                    }));
                  }}
                >
                  {CATEGORY_ORDER.map((cat) =>
                    taskGroups[cat].length ? (
                      <optgroup key={cat} label={categoryTitle(cat)}>
                        {taskGroups[cat].map((item) => (
                          <option key={item.id} value={item.id}>
                            {typeLabel(item.id)}
                          </option>
                        ))}
                      </optgroup>
                    ) : null,
                  )}
                </select>
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium">
                  {t.volunteerQuickTitle}
                </span>
                <input
                  className="field"
                  value={activityDraft.title}
                  onChange={(e) =>
                    setActivityDraft((d) => ({ ...d, title: e.target.value }))
                  }
                  placeholder={typeLabel(activityDraft.activityType)}
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">
                    {t.volunteerWorkDate}
                  </span>
                  <input
                    className="field"
                    type="date"
                    value={activityDraft.activityDate}
                    onChange={(e) =>
                      setActivityDraft((d) => ({
                        ...d,
                        activityDate: e.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    className="btn-ghost w-full"
                    onClick={() =>
                      setActivityDraft((d) => ({
                        ...d,
                        activityDate: todayIso(),
                      }))
                    }
                  >
                    {t.volunteerToday}
                  </button>
                </div>
              </div>

              <label className="block text-sm">
                <span className="mb-1 block font-medium">
                  {t.volunteerWorkDetail}{" "}
                  <span className="font-normal opacity-60">
                    ({t.emailOptional})
                  </span>
                </span>
                <textarea
                  className="field min-h-16"
                  value={activityDraft.description}
                  onChange={(e) =>
                    setActivityDraft((d) => ({
                      ...d,
                      description: e.target.value,
                    }))
                  }
                />
              </label>

              <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading}
              >
                {loading ? t.loading : t.volunteerLogWork}
              </button>
            </>
          )}
        </form>
      ) : null}

      {/* Tab: Team */}
      {tab === "team" ? (
        <section className="rounded-2xl bg-white/90 p-5">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--blood-deep)]">
            {t.volunteerList}
          </h2>
          <p className="mt-1 text-sm text-[color-mix(in_oklab,var(--ink)_60%,white)]">
            {t.volunteerListClickHint}
          </p>

          {detailId ? (
            <div className="mt-4">
              <AdminVolunteerDetailPanel
                volunteerId={detailId}
                portalUrl={portalUrl}
                onClose={() => setDetailId(null)}
                onNotify={(id, name) => openNotifyModal(id, name)}
              />
            </div>
          ) : null}

          {!volunteers.length ? (
            <p className="mt-3 text-sm text-[color-mix(in_oklab,var(--ink)_60%,white)]">
              {t.volunteerEmpty}
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-[var(--line)]">
              {volunteers.map((v) => (
                <li key={v.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#6e1220,#c45c26)] text-sm font-bold text-white"
                    >
                      {v.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          className="font-semibold text-[var(--ink)] underline-offset-2 hover:text-[var(--blood-deep)] hover:underline"
                          onClick={() => {
                            setDetailId(v.id);
                            setExpandedId(null);
                          }}
                        >
                          {v.name}
                        </button>
                        {!v.enabled ? (
                          <span className="rounded-full bg-[color-mix(in_oklab,var(--ink)_8%,white)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                            {t.volunteerInactive}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-sm text-[color-mix(in_oklab,var(--ink)_65%,white)]">
                        {v.role}
                        {v.username ? ` · @${v.username}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                        {t.volunteerWorkSummary
                          .replace("{total}", String(v.activityCount))
                          .replace("{done}", String(v.doneCount))
                          .replace("{progress}", String(v.inProgressCount))}
                        {donorStats[v.id]
                          ? ` · ${t.volunteerDonorCount.replace(
                              "{count}",
                              String(donorStats[v.id].approvedDonors),
                            )}`
                          : ""}
                      </p>
                    </div>
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        className="btn-ghost px-3 py-1.5 text-xs"
                        onClick={() =>
                          setMenuId(menuId === v.id ? null : v.id)
                        }
                      >
                        {t.volunteerActions}
                      </button>
                      {menuId === v.id ? (
                        <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-[var(--line)] bg-white shadow-lg">
                          <button
                            type="button"
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-[color-mix(in_oklab,var(--sand)_40%,white)]"
                            onClick={() => {
                              setExpandedId(expandedId === v.id ? null : v.id);
                              setMenuId(null);
                            }}
                          >
                            {expandedId === v.id
                              ? t.volunteerHideWork
                              : t.volunteerShowWork}
                          </button>
                          <button
                            type="button"
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-[color-mix(in_oklab,var(--sand)_40%,white)]"
                            onClick={() => {
                              setSelectedId(v.id);
                              setTab("work");
                              setMenuId(null);
                            }}
                          >
                            {t.volunteerLogWork}
                          </button>
                          <button
                            type="button"
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-[color-mix(in_oklab,var(--sand)_40%,white)]"
                            onClick={() => void toggleEnabled(v)}
                          >
                            {v.enabled
                              ? t.volunteerDisable
                              : t.volunteerEnable}
                          </button>
                          <button
                            type="button"
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-[color-mix(in_oklab,var(--sand)_40%,white)]"
                            onClick={() => void changeUsername(v)}
                          >
                            {t.volunteerChangeUsername}
                          </button>
                          <button
                            type="button"
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-[color-mix(in_oklab,var(--sand)_40%,white)]"
                            onClick={() => void resetPassword(v)}
                          >
                            {t.volunteerResetPassword}
                          </button>
                          <button
                            type="button"
                            className="block w-full px-3 py-2 text-left text-sm text-[var(--blood)] hover:bg-[color-mix(in_oklab,var(--blood)_8%,white)]"
                            onClick={() => void removeVolunteer(v.id)}
                          >
                            {t.delete}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {expandedId === v.id ? (
                    <div className="mt-3 space-y-3 border-l-2 border-[color-mix(in_oklab,var(--blood)_25%,white)] pl-4">
                      <div className="grid gap-3 lg:grid-cols-2">
                        <VolunteerVerbalUrlCard
                          kind="work"
                          token={v.linkToken}
                          origin={portalUrl}
                          compact
                        />
                        <VolunteerVerbalUrlCard
                          kind="join"
                          token={v.linkToken}
                          origin={portalUrl}
                          compact
                        />
                      </div>
                      <button
                        type="button"
                        className="btn-primary px-3 py-1 text-xs"
                        onClick={() => openNotifyModal(v.id, v.name)}
                      >
                        {t.volunteerSendNotify}
                      </button>
                      <ul className="space-y-2">
                      {!v.activities.length ? (
                        <li className="text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                          {t.volunteerNoWork}
                        </li>
                      ) : (
                        v.activities.map((a) => (
                          <li
                            key={a.id}
                            className="rounded-lg bg-[color-mix(in_oklab,var(--sand)_35%,white)] px-3 py-2 text-sm"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="font-semibold">{a.title}</p>
                                <p className="text-xs opacity-70">
                                  {typeLabel(a.activityType)} · {a.activityDate}{" "}
                                  · {statusLabel(a.status)}
                                </p>
                              </div>
                              <select
                                className="rounded-lg border border-[var(--line)] bg-white px-2 py-1 text-xs"
                                value={a.status}
                                onChange={(e) =>
                                  void setActivityStatus(
                                    a.id,
                                    e.target.value as Activity["status"],
                                  )
                                }
                              >
                                <option value="planned">
                                  {t.volunteerStatusPlanned}
                                </option>
                                <option value="in_progress">
                                  {t.volunteerStatusProgress}
                                </option>
                                <option value="done">
                                  {t.volunteerStatusDone}
                                </option>
                              </select>
                            </div>
                            {a.description ? (
                              <p className="mt-1 text-xs opacity-80">
                                {a.description}
                              </p>
                            ) : null}
                            {a.volunteerNote ? (
                              <p className="mt-1 text-xs text-[#245a40]">
                                {t.volunteerProgressNote}: {a.volunteerNote}
                              </p>
                            ) : null}
                            <button
                              type="button"
                              className="mt-1 text-xs text-[var(--blood)] underline"
                              onClick={() => void removeActivity(a.id)}
                            >
                              {t.delete}
                            </button>
                          </li>
                        ))
                      )}
                      </ul>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {notifyTarget ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--blood-deep)]">
              {notifyTarget.id === "all"
                ? t.volunteerNotifyAll
                : t.volunteerNotifyOne.replace("{name}", notifyTarget.name)}
            </h3>
            <label className="mt-4 block text-sm">
              <span className="mb-1 block font-medium">{t.volunteerNotifyTitlePrompt}</span>
              <input
                className="field"
                value={notifyTitle}
                onChange={(e) => setNotifyTitle(e.target.value)}
              />
            </label>
            <label className="mt-3 block text-sm">
              <span className="mb-1 block font-medium">{t.volunteerNotifyBodyPrompt}</span>
              <textarea
                className="field min-h-24"
                value={notifyBody}
                onChange={(e) => setNotifyBody(e.target.value)}
              />
            </label>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="btn-primary flex-1"
                disabled={loading || !notifyBody.trim()}
                onClick={() => void submitNotify()}
              >
                {loading ? t.loading : t.volunteerSendNotify}
              </button>
              <button
                type="button"
                className="btn-ghost flex-1"
                onClick={() => setNotifyTarget(null)}
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { VolunteerDonorPanel } from "@/components/VolunteerDonorPanel";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  getVolunteerTaskType,
  groupActivitiesByCategory,
  volunteerHasOpenModule,
  type VolunteerTaskCategory,
} from "@/lib/volunteer-tasks";

type Activity = {
  id: string;
  title: string;
  description: string;
  activityType: string;
  status: "planned" | "in_progress" | "done";
  activityDate: string;
  volunteerNote: string;
};

type Volunteer = {
  id: string;
  name: string;
  role: string;
  username: string;
  district: string;
};

const CATEGORY_ORDER: VolunteerTaskCategory[] = [
  "emergency",
  "humanitarian",
  "data",
  "outreach",
  "other",
];

export function VolunteerDashboard() {
  const { t } = useLocale();
  const router = useRouter();
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const showDonorModule = useMemo(
    () => volunteerHasOpenModule(activities, "donor_add"),
    [activities],
  );

  const grouped = useMemo(
    () => groupActivitiesByCategory(activities),
    [activities],
  );

  async function load() {
    const res = await fetch("/api/volunteer/me");
    if (!res.ok) {
      router.replace("/volunteer/login");
      return;
    }
    const data = await res.json();
    setVolunteer(data.volunteer);
    setActivities(data.activities || []);
    const map: Record<string, string> = {};
    for (const a of data.activities || []) {
      map[a.id] = a.volunteerNote || "";
    }
    setNotes(map);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [router]);

  async function logout() {
    await fetch("/api/volunteer/logout", { method: "POST" });
    router.replace("/volunteer/login");
  }

  async function saveTask(
    id: string,
    patch: { status?: Activity["status"]; volunteerNote?: string },
  ) {
    setSavingId(id);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/volunteer/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errorGeneric);
        return;
      }
      setActivities((list) =>
        list.map((a) => (a.id === id ? { ...a, ...data.activity } : a)),
      );
      if (data.activity?.volunteerNote != null) {
        setNotes((n) => ({ ...n, [id]: data.activity.volunteerNote }));
      }
      setMessage(t.saved);
    } catch {
      setError(t.errorGeneric);
    } finally {
      setSavingId(null);
    }
  }

  function statusLabel(status: Activity["status"]) {
    if (status === "done") return t.volunteerStatusDone;
    if (status === "in_progress") return t.volunteerStatusProgress;
    return t.volunteerStatusPlanned;
  }

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

  if (loading || !volunteer) {
    return (
      <p className="text-sm text-[color-mix(in_oklab,var(--ink)_60%,white)]">
        {t.loading}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-white/80 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[color-mix(in_oklab,var(--ink)_50%,white)]">
            {t.volunteerPortal}
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--blood-deep)]">
            {volunteer.name}
          </h1>
          <p className="mt-1 text-sm">
            {volunteer.role}
            {volunteer.district ? ` · ${volunteer.district}` : ""} · @
            {volunteer.username}
          </p>
          <p className="mt-2 text-xs text-[color-mix(in_oklab,var(--ink)_60%,white)]">
            {t.volunteerPortalHint}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/" className="btn-ghost">
            {t.volunteerViewSite}
          </Link>
          <button type="button" className="btn-ghost" onClick={() => void logout()}>
            {t.logout}
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-[var(--blood)]">{error}</p> : null}
      {message ? <p className="text-sm text-[var(--sage)]">{message}</p> : null}

      {showDonorModule ? <VolunteerDonorPanel /> : null}

      <section className="rounded-2xl bg-white/80 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
          {t.volunteerMyTasks}
        </h2>
        {!activities.length ? (
          <p className="mt-3 text-sm text-[color-mix(in_oklab,var(--ink)_60%,white)]">
            {t.volunteerNoAssignedTasks}
          </p>
        ) : (
          <div className="mt-4 space-y-6">
            {CATEGORY_ORDER.map((cat) => {
              const list = grouped[cat];
              if (!list.length) return null;
              return (
                <div key={cat}>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.08em] text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                    {categoryTitle(cat)}
                  </h3>
                  <ul className="space-y-4">
                    {list.map((a) => (
                      <li
                        key={a.id}
                        className={`rounded-xl border px-4 py-3 ${
                          cat === "emergency"
                            ? "border-[color-mix(in_oklab,var(--blood)_35%,white)] bg-[color-mix(in_oklab,var(--blood)_6%,white)]"
                            : "border-[var(--line)]"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold">
                              {a.title} · {statusLabel(a.status)}
                            </p>
                            <p className="text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                              {typeLabel(a.activityType)} · {a.activityDate}
                            </p>
                          </div>
                        </div>
                        {a.description ? (
                          <p className="mt-2 text-sm text-[color-mix(in_oklab,var(--ink)_75%,white)]">
                            {a.description}
                          </p>
                        ) : null}
                        <label className="mt-3 block text-sm">
                          <span className="mb-1 block font-medium">
                            {t.volunteerWorkStatus}
                          </span>
                          <select
                            className="field"
                            value={a.status}
                            disabled={savingId === a.id}
                            onChange={(e) =>
                              void saveTask(a.id, {
                                status: e.target.value as Activity["status"],
                                volunteerNote: notes[a.id] ?? a.volunteerNote,
                              })
                            }
                          >
                            <option value="planned">
                              {t.volunteerStatusPlanned}
                            </option>
                            <option value="in_progress">
                              {t.volunteerStatusProgress}
                            </option>
                            <option value="done">{t.volunteerStatusDone}</option>
                          </select>
                        </label>
                        <label className="mt-3 block text-sm">
                          <span className="mb-1 block font-medium">
                            {t.volunteerProgressNote}
                          </span>
                          <textarea
                            className="field min-h-20"
                            value={notes[a.id] ?? ""}
                            onChange={(e) =>
                              setNotes((n) => ({
                                ...n,
                                [a.id]: e.target.value,
                              }))
                            }
                            placeholder={t.volunteerProgressNoteHint}
                          />
                        </label>
                        <button
                          type="button"
                          className="btn-primary mt-3"
                          disabled={savingId === a.id}
                          onClick={() =>
                            void saveTask(a.id, {
                              status: a.status,
                              volunteerNote: notes[a.id] ?? "",
                            })
                          }
                        >
                          {savingId === a.id
                            ? t.loading
                            : t.volunteerSaveProgress}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

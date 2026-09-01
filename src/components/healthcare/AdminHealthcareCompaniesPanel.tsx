"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HealthcareVerbalUrlCard } from "@/components/healthcare/HealthcareVerbalUrlCard";
import { DISTRICTS } from "@/lib/districts";
import { useLocale } from "@/lib/i18n/locale-context";

type FacilityRef = {
  dghsId: string;
  name: string;
  nameBn: string;
};

type CompanyRow = {
  id: string;
  name: string;
  nameBn: string;
  contactPhone: string;
  contactEmail: string;
  linkToken: string;
  enabled: boolean;
  linkedDghsIds: string[];
  district: string;
  upazila: string;
  portalUrl: string;
  doctorCount: number;
  appointmentCount: number;
  pendingAppointments: number;
  facilities: FacilityRef[];
};

type FacilitySearchItem = {
  dghsId: string;
  name: string;
  nameBn: string;
  district: string;
  upazila: string;
  phone: string;
  email: string;
};

const emptyDraft = {
  name: "",
  nameBn: "",
  contactPhone: "",
  contactEmail: "",
  district: "Dhaka",
  upazila: "",
  facilityQuery: "",
  linkedDghsIds: [] as string[],
};

export function AdminHealthcareCompaniesPanel() {
  const { t } = useLocale();
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, doctors: 0, appointments: 0 });
  const [draft, setDraft] = useState(emptyDraft);
  const [facilityHits, setFacilityHits] = useState<FacilitySearchItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/healthcare/companies");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || t.errorGeneric);
        return;
      }
      setCompanies(json.companies || []);
      setStats(json.stats || { total: 0, active: 0, doctors: 0, appointments: 0 });
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [t.errorGeneric]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const q = draft.facilityQuery.trim();
    if (q.length < 2) {
      setFacilityHits([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void fetch(`/api/admin/healthcare?q=${encodeURIComponent(q)}&limit=8`)
        .then((res) => res.json())
        .then((json) => setFacilityHits(json.items || []))
        .catch(() => setFacilityHits([]));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [draft.facilityQuery]);

  const linkedFacilities = useMemo(
    () =>
      draft.linkedDghsIds.map((id) => {
        const hit = facilityHits.find((f) => f.dghsId === id);
        return hit || { dghsId: id, name: id, nameBn: "", district: "" };
      }),
    [draft.linkedDghsIds, facilityHits],
  );

  async function createCompany(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    const res = await fetch("/api/admin/healthcare/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft.name,
        nameBn: draft.nameBn,
        contactPhone: draft.contactPhone,
        contactEmail: draft.contactEmail,
        district: draft.district,
        upazila: draft.upazila,
        linkedDghsIds: draft.linkedDghsIds,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || t.errorGeneric);
      return;
    }
    setMessage(t.healthcareCompanyCreated);
    setDraft(emptyDraft);
    void load();
  }

  async function patchCompany(
    companyId: string,
    patch: Record<string, unknown>,
    successMsg?: string,
  ) {
    setError("");
    setMessage("");
    const res = await fetch("/api/admin/healthcare/companies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, ...patch }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || t.errorGeneric);
      return;
    }
    if (successMsg) setMessage(successMsg);
    void load();
  }

  async function deleteCompany(companyId: string) {
    if (!window.confirm(t.healthcareCompanyDeleteConfirm)) return;
    const res = await fetch(
      `/api/admin/healthcare/companies?companyId=${encodeURIComponent(companyId)}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      const json = await res.json();
      setError(json.error || t.errorGeneric);
      return;
    }
    setMessage(t.healthcareCompanyDeleted);
    void load();
  }

  function applyFacilityDefaults(
    draftState: typeof emptyDraft,
    item: FacilitySearchItem,
  ): typeof emptyDraft {
    return {
      ...draftState,
      name: draftState.name || item.name,
      nameBn: draftState.nameBn || item.nameBn,
      contactPhone: draftState.contactPhone || item.phone,
      contactEmail: draftState.contactEmail || item.email,
      district: item.district || draftState.district,
      upazila: item.upazila || draftState.upazila,
    };
  }

  function addFacility(item: FacilitySearchItem) {
    if (draft.linkedDghsIds.includes(item.dghsId)) return;
    setDraft((d) =>
      applyFacilityDefaults(
        {
          ...d,
          linkedDghsIds: [...d.linkedDghsIds, item.dghsId],
          facilityQuery: "",
        },
        item,
      ),
    );
    setFacilityHits([]);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--line)] bg-white/90 p-5 shadow-sm">
        <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--blood-deep)]">
          {t.healthcareCompanyAddTitle}
        </h3>
        <p className="mt-1 text-sm text-[color-mix(in_oklab,var(--ink)_58%,white)]">
          {t.healthcareCompanyAddHint}
        </p>
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(e) => void createCompany(e)}>
          <input
            className="input md:col-span-2"
            placeholder={t.healthcareCompanyName}
            value={draft.name}
            required={draft.linkedDghsIds.length === 0}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
          <input
            className="input md:col-span-2"
            placeholder={t.healthcareCompanyNameBn}
            value={draft.nameBn}
            onChange={(e) => setDraft((d) => ({ ...d, nameBn: e.target.value }))}
          />
          <input
            className="input"
            placeholder={t.healthcareCompanyPhone}
            value={draft.contactPhone}
            onChange={(e) => setDraft((d) => ({ ...d, contactPhone: e.target.value }))}
          />
          <input
            className="input"
            placeholder={t.healthcareCompanyEmail}
            value={draft.contactEmail}
            onChange={(e) => setDraft((d) => ({ ...d, contactEmail: e.target.value }))}
          />
          <select
            className="input"
            value={draft.district}
            onChange={(e) => setDraft((d) => ({ ...d, district: e.target.value }))}
          >
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder={t.healthcareUpazila}
            value={draft.upazila}
            onChange={(e) => setDraft((d) => ({ ...d, upazila: e.target.value }))}
          />
          <div className="relative md:col-span-2">
            <input
              className="input"
              placeholder={t.healthcareLinkFacility}
              value={draft.facilityQuery}
              onChange={(e) => setDraft((d) => ({ ...d, facilityQuery: e.target.value }))}
            />
            <p className="mt-1 text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
              {t.healthcareLinkAutoFill}
            </p>
            {facilityHits.length > 0 ? (
              <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-[var(--line)] bg-white shadow-lg">
                {facilityHits.map((f) => (
                  <li key={f.dghsId}>
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--cream)]"
                      onClick={() => addFacility(f)}
                    >
                      <span className="font-medium">{f.name}</span>
                      <span className="mt-0.5 block text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                        {[f.district, f.upazila].filter(Boolean).join(" · ")} · {f.dghsId}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          {linkedFacilities.length > 0 ? (
            <ul className="flex flex-wrap gap-2 md:col-span-2">
              {linkedFacilities.map((f) => (
                <li
                  key={f.dghsId}
                  className="flex items-center gap-2 rounded-full bg-[var(--cream)] px-3 py-1 text-xs"
                >
                  <span>{f.name}</span>
                  <button
                    type="button"
                    className="text-[var(--blood)]"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        linkedDghsIds: d.linkedDghsIds.filter((id) => id !== f.dghsId),
                      }))
                    }
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <button type="submit" className="btn-primary md:col-span-2">
            {t.healthcareCompanyCreate}
          </button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-[var(--cream)] px-3 py-1">
          {t.healthcareCompanyTotal}: <strong>{stats.total}</strong>
        </span>
        <span className="rounded-full bg-[var(--cream)] px-3 py-1">
          {t.healthcareCompanyActive}: <strong>{stats.active}</strong>
        </span>
        <span className="rounded-full bg-[var(--cream)] px-3 py-1">
          {t.healthcareDoctors}: <strong>{stats.doctors}</strong>
        </span>
        <span className="rounded-full bg-[var(--cream)] px-3 py-1">
          {t.healthcareAppointments}: <strong>{stats.appointments}</strong>
        </span>
      </div>

      {error ? <p className="text-sm text-[var(--blood)]">{error}</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {loading ? <p className="text-sm">{t.loading}</p> : null}

      <ul className="space-y-3">
        {companies.map((c) => (
          <li
            key={c.id}
            className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white/90 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
              <div>
                <p className="font-semibold text-[var(--ink)]">
                  {c.name}
                  {!c.enabled ? (
                    <span className="ml-2 rounded bg-gray-200 px-2 py-0.5 text-[10px] uppercase">
                      {t.healthcareDisabled}
                    </span>
                  ) : null}
                </p>
                {c.nameBn ? (
                  <p className="text-xs text-[color-mix(in_oklab,var(--ink)_60%,white)]">{c.nameBn}</p>
                ) : null}
                <p className="mt-1 text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
                  {c.district}
                  {c.upazila ? ` · ${c.upazila}` : ""} · {c.doctorCount} {t.healthcareDoctors.toLowerCase()} ·{" "}
                  {c.pendingAppointments} {t.healthcarePending}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-ghost px-3 py-1 text-xs"
                  onClick={() => setExpandedId((id) => (id === c.id ? null : c.id))}
                >
                  {expandedId === c.id ? t.healthcareCollapse : t.healthcareExpand}
                </button>
                <button
                  type="button"
                  className="btn-ghost px-3 py-1 text-xs"
                  onClick={() =>
                    void patchCompany(c.id, { enabled: !c.enabled }, t.healthcareCompanyUpdated)
                  }
                >
                  {c.enabled ? t.healthcareDisable : t.healthcareEnable}
                </button>
                <button
                  type="button"
                  className="btn-ghost px-3 py-1 text-xs text-[var(--blood)]"
                  onClick={() => void deleteCompany(c.id)}
                >
                  {t.delete}
                </button>
              </div>
            </div>
            {expandedId === c.id ? (
              <div className="space-y-4 p-4">
                <HealthcareVerbalUrlCard token={c.linkToken} compact />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-ghost px-3 py-1 text-xs"
                    onClick={() =>
                      void patchCompany(c.id, { regenerateToken: true }, t.healthcareTokenRegenerated)
                    }
                  >
                    {t.healthcareRegenerateToken}
                  </button>
                  <a
                    className="btn-primary px-3 py-1 text-xs"
                    href={c.portalUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t.healthcareOpenPortal}
                  </a>
                </div>
                {c.facilities.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color-mix(in_oklab,var(--ink)_50%,white)]">
                      {t.healthcareLinkedFacilities}
                    </p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {c.facilities.map((f) => (
                        <li key={f.dghsId}>
                          {f.name}{" "}
                          <a
                            className="text-[var(--blood-deep)] underline"
                            href={`/healthcare/i/${f.dghsId}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {t.healthcareViewPublic}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

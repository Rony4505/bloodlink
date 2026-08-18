"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { defaultTeamShort } from "@/lib/cricket/fixture";
import { formatScheduleWhen } from "@/lib/cricket/format";
import type { MatchFormat } from "@/lib/cricket/types";

type MatchRow = {
  id: string;
  title: string;
  format: MatchFormat;
  status: "upcoming" | "live" | "completed";
  venue: string;
  teamA: { name: string; short: string };
  teamB: { name: string; short: string };
  scheduledAt?: string;
  innings: { legalBalls: number }[];
};

type TenantDetails = {
  name: string;
  brandColor: string;
  contactPhone: string;
  description: string;
  venue: string;
  startDate: string;
  endDate: string;
};

type FixtureDraft = {
  title: string;
  teamA: string;
  teamAShort: string;
  teamB: string;
  teamBShort: string;
  venue: string;
  format: MatchFormat;
  scheduledAt: string;
  battingFirst: "a" | "b";
};

const EMPTY_FIXTURE: FixtureDraft = {
  title: "",
  teamA: "",
  teamAShort: "",
  teamB: "",
  teamBShort: "",
  venue: "",
  format: "T20",
  scheduledAt: "",
  battingFirst: "a",
};

function toLocalDatetime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIsoFromLocal(local: string): string | undefined {
  if (!local) return undefined;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

type Props = {
  slug: string;
  pin: string;
  tenant: TenantDetails | null;
  matches: MatchRow[];
  onUpdated: () => void;
  onMsg: (msg: string) => void;
};

export function TournamentSetup({ slug, pin, tenant, matches, onUpdated, onMsg }: Props) {
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<"details" | "fixtures">("details");
  const [details, setDetails] = useState<TenantDetails>({
    name: "",
    brandColor: "#0B6E4F",
    contactPhone: "",
    description: "",
    venue: "",
    startDate: "",
    endDate: "",
  });
  const [draftRows, setDraftRows] = useState<FixtureDraft[]>([{ ...EMPTY_FIXTURE }]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<FixtureDraft & { matchId: string } | null>(null);

  useEffect(() => {
    if (!tenant) return;
    setDetails(tenant);
  }, [tenant]);

  const upcoming = useMemo(
    () =>
      matches.filter((m) => {
        if (m.status === "completed") return false;
        const balls = m.innings.reduce((n, inn) => n + inn.legalBalls, 0);
        return m.status === "upcoming" || balls === 0;
      }),
    [matches],
  );

  function saveDetails() {
    startTransition(async () => {
      const res = await fetch("/api/cricket/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "tenant_self_update",
          slug,
          tenantPin: pin,
          name: details.name,
          brandColor: details.brandColor,
          contactPhone: details.contactPhone,
          description: details.description,
          venue: details.venue,
          startDate: details.startDate || undefined,
          endDate: details.endDate || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onMsg(data.error || "সেভ ব্যর্থ");
        return;
      }
      onMsg("টুর্নামেন্ট details সেভ হয়েছে");
      onUpdated();
    });
  }

  function addDraftRow() {
    setDraftRows((rows) => [...rows, { ...EMPTY_FIXTURE, venue: details.venue }]);
  }

  function updateDraftRow(index: number, patch: Partial<FixtureDraft>) {
    setDraftRows((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function removeDraftRow(index: number) {
    setDraftRows((rows) => (rows.length <= 1 ? rows : rows.filter((_, i) => i !== index)));
  }

  function createFixtures() {
    const fixtures = draftRows
      .filter((r) => r.teamA.trim() && r.teamB.trim())
      .map((r) => ({
        title: r.title.trim() || `${r.teamA.trim()} vs ${r.teamB.trim()}`,
        teamAName: r.teamA.trim(),
        teamAShort: r.teamAShort.trim() || defaultTeamShort(r.teamA, "TEA"),
        teamBName: r.teamB.trim(),
        teamBShort: r.teamBShort.trim() || defaultTeamShort(r.teamB, "TEB"),
        venue: r.venue.trim() || details.venue,
        format: r.format,
        battingFirst: r.battingFirst,
        scheduledAt: toIsoFromLocal(r.scheduledAt),
      }));

    if (fixtures.length === 0) {
      onMsg("কমপক্ষে একটি ম্যাচে দুটো দলের নাম দিন");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/cricket/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: fixtures.length === 1 ? "create_match" : "create_matches",
          slug,
          tenantPin: pin,
          fixtures: fixtures.length === 1 ? undefined : fixtures,
          ...(fixtures.length === 1 ? fixtures[0] : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onMsg(data.error || "fixture তৈরি ব্যর্থ");
        return;
      }
      onMsg(`${fixtures.length}টি fixture যোগ হয়েছে`);
      setDraftRows([{ ...EMPTY_FIXTURE, venue: details.venue }]);
      onUpdated();
    });
  }

  function startEdit(m: MatchRow) {
    setEditingId(m.id);
    setEditDraft({
      matchId: m.id,
      title: m.title,
      teamA: m.teamA.name,
      teamAShort: m.teamA.short,
      teamB: m.teamB.name,
      teamBShort: m.teamB.short,
      venue: m.venue,
      format: m.format,
      scheduledAt: toLocalDatetime(m.scheduledAt),
      battingFirst: "a",
    });
  }

  function saveEdit() {
    if (!editDraft) return;
    startTransition(async () => {
      const res = await fetch(`/api/cricket/matches/${editDraft.matchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_fixture",
          tenantPin: pin,
          title: editDraft.title,
          format: editDraft.format,
          venue: editDraft.venue,
          teamAName: editDraft.teamA,
          teamAShort: editDraft.teamAShort,
          teamBName: editDraft.teamB,
          teamBShort: editDraft.teamBShort,
          battingFirst: editDraft.battingFirst,
          scheduledAt: toIsoFromLocal(editDraft.scheduledAt),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onMsg(data.error || "আপডেট ব্যর্থ");
        return;
      }
      onMsg("fixture আপডেট হয়েছে");
      setEditingId(null);
      setEditDraft(null);
      onUpdated();
    });
  }

  function deleteFixture(matchId: string) {
    if (!confirm("এই fixture মুছে ফেলবেন?")) return;
    startTransition(async () => {
      const res = await fetch("/api/cricket/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_match", slug, tenantPin: pin, matchId }),
      });
      const data = await res.json();
      if (!res.ok) {
        onMsg(data.error || "মুছতে ব্যর্থ");
        return;
      }
      onMsg("fixture মুছে ফেলা হয়েছে");
      onUpdated();
    });
  }

  return (
    <section className="pl-card-block pl-tournament-setup">
      <h2>টুর্নামেন্ট সেটআপ</h2>
      <p className="pl-muted">রেন্ট নেওয়ার পর শুরুতে এখানে পুরো টুর্নামেন্ট details ও match fixtures আপডেট করুন</p>

      <div className="pl-tabs">
        <button type="button" className={tab === "details" ? "on" : ""} onClick={() => setTab("details")}>
          টুর্নামেন্ট details
        </button>
        <button type="button" className={tab === "fixtures" ? "on" : ""} onClick={() => setTab("fixtures")}>
          Match fixtures
        </button>
      </div>

      {tab === "details" ? (
        <div className="pl-form pl-setup-form">
          <label className="pl-note">
            টুর্নামেন্ট / ক্লাব নাম
            <input value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} />
          </label>
          <label className="pl-note">
            বর্ণনা
            <textarea
              rows={3}
              value={details.description}
              onChange={(e) => setDetails({ ...details, description: e.target.value })}
              placeholder="যেমন: ঈদ কাপ ২০২৬, ৮ দল, গ্রুপ+নকআউট"
            />
          </label>
          <label className="pl-note">
            মূল ভেন্যু
            <input
              value={details.venue}
              onChange={(e) => setDetails({ ...details, venue: e.target.value })}
              placeholder="যেমন: মিরপুর গ্রাউন্ড"
            />
          </label>
          <div className="pl-field-grid compact">
            <label className="pl-note">
              শুরু
              <input
                type="date"
                value={details.startDate}
                onChange={(e) => setDetails({ ...details, startDate: e.target.value })}
              />
            </label>
            <label className="pl-note">
              শেষ
              <input
                type="date"
                value={details.endDate}
                onChange={(e) => setDetails({ ...details, endDate: e.target.value })}
              />
            </label>
          </div>
          <div className="pl-field-grid compact">
            <label className="pl-note">
              যোগাযোগ
              <input
                value={details.contactPhone}
                onChange={(e) => setDetails({ ...details, contactPhone: e.target.value })}
                placeholder="01XXXXXXXXX"
              />
            </label>
            <label className="pl-note">
              ব্র্যান্ড রং
              <input
                type="color"
                value={details.brandColor}
                onChange={(e) => setDetails({ ...details, brandColor: e.target.value })}
              />
            </label>
          </div>
          <button type="button" className="pl-btn primary" disabled={pending} onClick={saveDetails}>
            Details সেভ
          </button>
        </div>
      ) : null}

      {tab === "fixtures" ? (
        <div className="pl-fixtures-panel">
          <h3>নতুন fixture যোগ করুন</h3>
          {draftRows.map((row, index) => (
            <div key={index} className="pl-fixture-draft">
              <div className="pl-field-grid compact">
                <label className="pl-note">
                  ম্যাচ টাইটেল
                  <input
                    value={row.title}
                    onChange={(e) => updateDraftRow(index, { title: e.target.value })}
                    placeholder="যেমন: গ্রুপ A — ম্যাচ ১"
                  />
                </label>
                <label className="pl-note">
                  ফরম্যাট
                  <select
                    value={row.format}
                    onChange={(e) => updateDraftRow(index, { format: e.target.value as MatchFormat })}
                  >
                    <option value="T20">T20</option>
                    <option value="ODI">ODI</option>
                    <option value="Test">Test</option>
                    <option value="Custom">Custom</option>
                  </select>
                </label>
              </div>
              <div className="pl-field-grid compact">
                <label className="pl-note">
                  টিম A
                  <input value={row.teamA} onChange={(e) => updateDraftRow(index, { teamA: e.target.value })} />
                </label>
                <label className="pl-note">
                  Short
                  <input
                    value={row.teamAShort}
                    onChange={(e) => updateDraftRow(index, { teamAShort: e.target.value.toUpperCase() })}
                    placeholder="MIR"
                  />
                </label>
                <label className="pl-note">
                  টিম B
                  <input value={row.teamB} onChange={(e) => updateDraftRow(index, { teamB: e.target.value })} />
                </label>
                <label className="pl-note">
                  Short
                  <input
                    value={row.teamBShort}
                    onChange={(e) => updateDraftRow(index, { teamBShort: e.target.value.toUpperCase() })}
                    placeholder="DHN"
                  />
                </label>
              </div>
              <div className="pl-field-grid compact">
                <label className="pl-note">
                  ভেন্যু
                  <input value={row.venue} onChange={(e) => updateDraftRow(index, { venue: e.target.value })} />
                </label>
                <label className="pl-note">
                  সময়
                  <input
                    type="datetime-local"
                    value={row.scheduledAt}
                    onChange={(e) => updateDraftRow(index, { scheduledAt: e.target.value })}
                  />
                </label>
                <label className="pl-note">
                  ব্যাটিং প্রথম
                  <select
                    value={row.battingFirst}
                    onChange={(e) => updateDraftRow(index, { battingFirst: e.target.value as "a" | "b" })}
                  >
                    <option value="a">টিম A</option>
                    <option value="b">টিম B</option>
                  </select>
                </label>
              </div>
              {draftRows.length > 1 ? (
                <button type="button" className="pl-btn ghost" onClick={() => removeDraftRow(index)}>
                  সারি মুছুন
                </button>
              ) : null}
            </div>
          ))}
          <div className="pl-actions-row wrap">
            <button type="button" className="pl-btn ghost" onClick={addDraftRow}>
              + আরেকটি fixture
            </button>
            <button type="button" className="pl-btn primary" disabled={pending} onClick={createFixtures}>
              Fixture(s) যোগ করুন
            </button>
          </div>

          <h3 style={{ marginTop: "1.5rem" }}>আগে থেকে যোগ করা fixtures</h3>
          {upcoming.length === 0 ? (
            <p className="pl-muted">এখনো কোনো upcoming fixture নেই</p>
          ) : (
            <div className="pl-fixture-list">
              {upcoming.map((m) =>
                editingId === m.id && editDraft ? (
                  <div key={m.id} className="pl-fixture-draft">
                    <strong>এডিট: {m.title}</strong>
                    <div className="pl-field-grid compact">
                      <label className="pl-note">
                        টাইটেল
                        <input
                          value={editDraft.title}
                          onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
                        />
                      </label>
                      <label className="pl-note">
                        ফরম্যাট
                        <select
                          value={editDraft.format}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, format: e.target.value as MatchFormat })
                          }
                        >
                          <option value="T20">T20</option>
                          <option value="ODI">ODI</option>
                          <option value="Test">Test</option>
                          <option value="Custom">Custom</option>
                        </select>
                      </label>
                    </div>
                    <div className="pl-field-grid compact">
                      <label className="pl-note">
                        টিম A
                        <input
                          value={editDraft.teamA}
                          onChange={(e) => setEditDraft({ ...editDraft, teamA: e.target.value })}
                        />
                      </label>
                      <label className="pl-note">
                        Short
                        <input
                          value={editDraft.teamAShort}
                          onChange={(e) => setEditDraft({ ...editDraft, teamAShort: e.target.value })}
                        />
                      </label>
                      <label className="pl-note">
                        টিম B
                        <input
                          value={editDraft.teamB}
                          onChange={(e) => setEditDraft({ ...editDraft, teamB: e.target.value })}
                        />
                      </label>
                      <label className="pl-note">
                        Short
                        <input
                          value={editDraft.teamBShort}
                          onChange={(e) => setEditDraft({ ...editDraft, teamBShort: e.target.value })}
                        />
                      </label>
                    </div>
                    <div className="pl-field-grid compact">
                      <label className="pl-note">
                        ভেন্যু
                        <input
                          value={editDraft.venue}
                          onChange={(e) => setEditDraft({ ...editDraft, venue: e.target.value })}
                        />
                      </label>
                      <label className="pl-note">
                        সময়
                        <input
                          type="datetime-local"
                          value={editDraft.scheduledAt}
                          onChange={(e) => setEditDraft({ ...editDraft, scheduledAt: e.target.value })}
                        />
                      </label>
                    </div>
                    <div className="pl-actions-row wrap">
                      <button type="button" className="pl-btn primary" disabled={pending} onClick={saveEdit}>
                        সেভ
                      </button>
                      <button
                        type="button"
                        className="pl-btn ghost"
                        onClick={() => {
                          setEditingId(null);
                          setEditDraft(null);
                        }}
                      >
                        বাতিল
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="pl-fixture-row">
                    <div>
                      <strong>{m.title}</strong>
                      <p className="pl-muted">
                        {m.teamA.name} ({m.teamA.short}) vs {m.teamB.name} ({m.teamB.short}) · {m.format}
                        {m.scheduledAt ? ` · ${formatScheduleWhen(m.scheduledAt)}` : ""}
                        {m.venue ? ` · ${m.venue}` : ""}
                      </p>
                    </div>
                    <div className="pl-actions-row wrap">
                      <Link className="pl-btn ghost" href={`/cricket/t/${slug}/m/${m.id}/team`}>
                        টিম লিস্ট
                      </Link>
                      <button type="button" className="pl-btn" onClick={() => startEdit(m)}>
                        এডিট
                      </button>
                      <button type="button" className="pl-btn ghost danger-text" onClick={() => deleteFixture(m.id)}>
                        মুছুন
                      </button>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

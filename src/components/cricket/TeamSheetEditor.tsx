"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { roleLabelBn } from "@/lib/cricket/stats";
import type { Match, Player, PlayerRole, TeamSide } from "@/lib/cricket/types";
import "./cricket.css";

const ROLES: PlayerRole[] = ["batter", "bowler", "allrounder", "wk"];

type Props = { slug: string; matchId: string };

function blankRow(team: TeamSide, i: number): Player {
  return { id: `tmp_${team}_${i}`, name: "", team, role: "batter", number: i + 1 };
}

function sidePlayers(match: Match | null, side: TeamSide): Player[] {
  const rows = [...((match?.players || []).filter((p) => p.team === side))];
  while (rows.length < 11) rows.push(blankRow(side, rows.length));
  return rows.slice(0, 11).map((p, i) => ({ ...p, number: i + 1 }));
}

export function TeamSheetEditor({ slug, matchId }: Props) {
  const [match, setMatch] = useState<Match | null>(null);
  const [teamA, setTeamA] = useState<Player[]>([]);
  const [teamB, setTeamB] = useState<Player[]>([]);
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState("");
  const [blankPrint, setBlankPrint] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const saved = sessionStorage.getItem(`pl-pin-${slug}`) || "";
    setPin(saved);
    fetch(`/api/cricket/matches/${matchId}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "লোড ব্যর্থ");
        setMatch(data.match);
        setTeamA(sidePlayers(data.match, "a"));
        setTeamB(sidePlayers(data.match, "b"));
      })
      .catch((e: Error) => setMsg(e.message));
  }, [matchId, slug]);

  const title = useMemo(() => match?.title || "Team List", [match]);
  const editorA = teamA;
  const editorB = teamB;

  function updateRow(side: TeamSide, index: number, patch: Partial<Player>) {
    const setter = side === "a" ? setTeamA : setTeamB;
    setter((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  function save() {
    startTransition(async () => {
      const players = [...teamA, ...teamB].map((p, i) => ({
        ...p,
        id: p.id.startsWith("tmp_") ? undefined : p.id,
        name: p.name.trim() || `Player ${i + 1}`,
      }));
      const res = await fetch(`/api/cricket/matches/${matchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_lineup", tenantPin: pin, players }),
      });
      const data = await res.json();
      if (!res.ok) return setMsg(data.error || "সেভ ব্যর্থ");
      sessionStorage.setItem(`pl-pin-${slug}`, pin);
      setMatch(data.match);
      setTeamA(sidePlayers(data.match, "a"));
      setTeamB(sidePlayers(data.match, "b"));
      setMsg("টিম লিস্ট সেভ হয়েছে");
    });
  }

  function TeamTable({ side, rows, heading, blank }: { side: TeamSide; rows: Player[]; heading: string; blank: boolean }) {
    const displayRows = blank ? Array.from({ length: 11 }, (_, i) => blankRow(side, i)) : rows;
    return (
      <section className={`pl-sheet-card${blank ? " pl-sheet-blank" : ""}`}>
        <h2>{heading}</h2>
        <table className="pl-sheet-table">
          <thead>
            <tr><th>#</th><th>নাম</th><th>রোল</th></tr>
          </thead>
          <tbody>
            {displayRows.map((p, i) => (
              <tr key={`${side}-${i}`}>
                <td>{i + 1}</td>
                <td>
                  {blank ? (
                    <span className="pl-blank-line" aria-hidden />
                  ) : (
                    <input value={p.name} onChange={(e) => updateRow(side, i, { name: e.target.value })} placeholder={`প্লেয়ার ${i + 1}`} />
                  )}
                </td>
                <td>
                  {blank ? (
                    <span className="pl-blank-line" aria-hidden />
                  ) : (
                    <select value={p.role} onChange={(e) => updateRow(side, i, { role: e.target.value as PlayerRole })}>
                      {ROLES.map((r) => <option key={r} value={r}>{roleLabelBn(r)}</option>)}
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    );
  }

  return (
    <div className="pl-shell">
      <div className="pl-team-sheet">
        <header className="pl-topbar no-print">
          <Link href={`/cricket/t/${slug}/m/${matchId}`}>← লাইভ</Link>
          <span>টিম লিস্ট / প্রিন্ট</span>
        </header>

        <div className="pl-sheet-toolbar no-print">
          <h1>{title}</h1>
          <p className="pl-muted">চাইলে ফাঁকা team list প্রিন্ট করো, পরে নাম লিখে এনে এখানে update করো।</p>
          <div className="pl-form" style={{ maxWidth: 360 }}>
            <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="ক্লাব পিন" />
          </div>
          <label className="pl-check-row">
            <input type="checkbox" checked={blankPrint} onChange={(e) => setBlankPrint(e.target.checked)} />
            <span>Blank print sheet (নাম + রোল দুটোই ফাঁকা)</span>
          </label>
          <div className="pl-actions-row wrap">
            <button type="button" className="pl-btn primary" disabled={pending} onClick={save}>সেভ করুন</button>
            <button type="button" className="pl-btn" onClick={() => window.print()}>প্রিন্ট / PDF</button>
            <Link className="pl-btn ghost" href={`/cricket/t/${slug}/m/${matchId}/score`}>স্কোরার</Link>
          </div>
          {msg ? <p className="pl-muted">{msg}</p> : null}
        </div>

        <div className="pl-sheet-print-head print-only">
          <h1>PitchLive — Team List</h1>
          <h2>{title}</h2>
          <p>{match?.teamA.name} vs {match?.teamB.name}{match?.venue ? ` · ${match.venue}` : ""}</p>
        </div>

        <div className={`pl-sheet-grid${blankPrint ? " pl-sheet-blank-print" : ""}`}>
          <TeamTable side="a" rows={editorA} heading={match?.teamA.name || "টিম A"} blank={blankPrint} />
          <TeamTable side="b" rows={editorB} heading={match?.teamB.name || "টিম B"} blank={blankPrint} />
        </div>
      </div>
    </div>
  );
}

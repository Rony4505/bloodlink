"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { roleLabelBn } from "@/lib/cricket/stats";
import type { BallType, GraphicKind, Match, Player } from "@/lib/cricket/types";
import { LiveScoreBoard } from "./LiveScoreBoard";

const RUN_BTNS = [0, 1, 2, 3, 4, 6] as const;
const WICKET_TYPES = [
  "Bowled",
  "Caught",
  "LBW",
  "Run out",
  "Stumped",
  "Hit wicket",
  "Retired hurt",
] as const;
const GRAPHICS: { kind: GraphicKind; label: string }[] = [
  { kind: "batting", label: "Batting XI" },
  { kind: "bowling", label: "Bowling" },
  { kind: "teams", label: "Bat + Bowl" },
  { kind: "batter", label: "Batter" },
  { kind: "bowler", label: "Bowler" },
  { kind: "partnership", label: "Partnership" },
  { kind: "schedule", label: "Next match" },
  { kind: "hidden", label: "Hide" },
];

type Props = {
  matchId: string;
  tenantPin: string;
  accent?: string;
  initialMatch: Match;
  slug: string;
};

export function ScorerConsole({ matchId, tenantPin, accent, initialMatch, slug }: Props) {
  const [match, setMatch] = useState(initialMatch);
  const [videoUrl, setVideoUrl] = useState(initialMatch.videoUrl || "");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [playerId, setPlayerId] = useState(initialMatch.players[0]?.id || "");
  const [showWicket, setShowWicket] = useState(false);
  const [dismissal, setDismissal] = useState<(typeof WICKET_TYPES)[number]>("Bowled");
  const [dismissedPlayerId, setDismissedPlayerId] = useState("");
  const [showNextBowler, setShowNextBowler] = useState(false);
  const [pending, startTransition] = useTransition();

  const inn = match.innings[match.currentInningsIndex];
  const battingTeam = inn?.battingTeam === "a" ? match.teamA : match.teamB;
  const bowlingTeam = inn?.battingTeam === "a" ? match.teamB : match.teamA;
  const battingPlayers = useMemo(
    () => match.players.filter((p) => p.team === inn?.battingTeam),
    [match.players, inn?.battingTeam],
  );
  const bowlingPlayers = useMemo(
    () => match.players.filter((p) => p.team !== inn?.battingTeam),
    [match.players, inn?.battingTeam],
  );

  const [strikerId, setStrikerId] = useState(inn?.strikerId || "");
  const [nonStrikerId, setNonStrikerId] = useState(inn?.nonStrikerId || "");
  const [bowlerId, setBowlerId] = useState(inn?.bowlerId || "");

  useEffect(() => {
    setVideoUrl(match.videoUrl || "");
    const current = match.innings[match.currentInningsIndex];
    setStrikerId(current?.strikerId || "");
    setNonStrikerId(current?.nonStrikerId || "");
    setBowlerId(current?.bowlerId || "");
    setDismissedPlayerId(current?.strikerId || "");
  }, [match]);

  function playerName(id: string) {
    return match.players.find((p) => p.id === id)?.name || "";
  }

  function post(body: Record<string, unknown>, after?: (nextMatch: Match) => void) {
    startTransition(async () => {
      setMsg("");
      const beforeBalls = match.innings[match.currentInningsIndex]?.legalBalls || 0;
      try {
        const res = await fetch(`/api/cricket/matches/${matchId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantPin,
            strikerId,
            nonStrikerId,
            bowlerId,
            strikerName: playerName(strikerId),
            nonStrikerName: playerName(nonStrikerId),
            bowlerName: playerName(bowlerId),
            note: note || undefined,
            ...body,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setMsg(data.error || "ব্যর্থ");
          return;
        }
        setMatch(data.match);
        if (body.action !== "set_graphic") setNote("");
        const nextBalls = data.match.innings[data.match.currentInningsIndex]?.legalBalls || 0;
        const overEnded = beforeBalls !== nextBalls && nextBalls > 0 && nextBalls % 6 === 0;
        if (overEnded && body.action === "ball") {
          setShowNextBowler(true);
          setMsg("ওভার শেষ — next bowler select করুন");
        }
        after?.(data.match);
      } catch {
        setMsg("নেটওয়ার্ক সমস্যা");
      }
    });
  }

  function ball(type: BallType, runs: number, isWicket = false) {
    post({ action: "ball", type, runs, isWicket });
  }

  function savePlayers() {
    post({ action: "set_players" });
  }

  function submitWicket() {
    const nonStrikerOut = dismissedPlayerId === nonStrikerId;
    const wicketNote = dismissal === "Retired hurt" ? "Retired hurt" : dismissal;
    post(
      {
        action: "ball",
        type: "wicket",
        runs: 0,
        isWicket: true,
        nonStrikerOut,
        note: wicketNote,
      },
      () => {
        setShowWicket(false);
      },
    );
  }

  const activeGraphic = match.graphic?.kind || "hidden";

  return (
    <div className="pl-scorer">
      <LiveScoreBoard match={match} accent={accent} />

      <div className="pl-scorer-panel">
        <div className="pl-actions-row wrap">
          <Link className="pl-btn" href={`/cricket/t/${slug}/m/${matchId}/team`}>
            টিম লিস্ট / প্রিন্ট
          </Link>
          <Link className="pl-btn" href={`/cricket/t/${slug}/m/${matchId}/report`}>
            ম্যাচ রিপোর্ট
          </Link>
          <Link className="pl-btn ghost" href={`/cricket/t/${slug}/stats`}>
            টুর্নামেন্ট Stats
          </Link>
        </div>

        <h2>স্কোর আপডেট</h2>
        <div className="pl-field-grid compact">
          <label>
            Striker
            <select value={strikerId} onChange={(e) => setStrikerId(e.target.value)}>
              {battingPlayers.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {roleLabelBn(p.role)}</option>
              ))}
            </select>
          </label>
          <label>
            Non striker
            <select value={nonStrikerId} onChange={(e) => setNonStrikerId(e.target.value)}>
              {battingPlayers.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {roleLabelBn(p.role)}</option>
              ))}
            </select>
          </label>
          <label>
            Bowler
            <select value={bowlerId} onChange={(e) => setBowlerId(e.target.value)}>
              {bowlingPlayers.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {roleLabelBn(p.role)}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="pl-actions-row wrap sticky-tools">
          <button type="button" className="pl-btn ghost" disabled={pending} onClick={savePlayers}>Apply players</button>
          <button type="button" className="pl-btn undo-hot" disabled={pending} onClick={() => post({ action: "undo" })}>Undo</button>
          <button type="button" className="pl-btn" disabled={pending || match.innings.length > 1} onClick={() => post({ action: "second_innings" })}>২য় ইনিংস</button>
          <button type="button" className="pl-btn ghost" disabled={pending} onClick={() => post({ action: "complete" })}>ম্যাচ শেষ</button>
        </div>

        <div className="pl-pad pl-pad-tight">
          {RUN_BTNS.map((n) => (
            <button key={n} type="button" disabled={pending} onClick={() => ball("run", n)}>{n}</button>
          ))}
          <button type="button" className="danger" disabled={pending} onClick={() => setShowWicket(true)}>W</button>
          <button type="button" disabled={pending} onClick={() => ball("wide", 0)}>WD</button>
          <button type="button" disabled={pending} onClick={() => ball("noball", 0)}>NB</button>
          <button type="button" disabled={pending} onClick={() => ball("bye", 1)}>Bye 1</button>
          <button type="button" disabled={pending} onClick={() => ball("legbye", 1)}>LB 1</button>
        </div>

        <div className="pl-graphic-controls">
          <h3>স্ট্রিম গ্রাফিক্স</h3>
          <p className="pl-muted">Performance stream-এর মাঝখানে show হবে</p>
          <div className="pl-graphic-btns">
            {GRAPHICS.map((g) => (
              <button key={g.kind} type="button" className={activeGraphic === g.kind ? "on" : ""} disabled={pending} onClick={() => post({ action: "set_graphic", graphicKind: g.kind })}>{g.label}</button>
            ))}
          </div>
          <label className="pl-note">
            যেকোনো প্লেয়ার performance
            <select value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
              {match.players.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {roleLabelBn(p.role)}</option>
              ))}
            </select>
          </label>
          <button type="button" className="pl-btn primary" disabled={pending || !playerId} onClick={() => post({ action: "set_graphic", graphicKind: "player", playerId })}>এই প্লেয়ার দেখান</button>
          <button type="button" className="pl-btn" disabled={pending || !playerId} onClick={() => post({ action: "set_graphic", graphicKind: "player_teams", playerId })}>দল অনুযায়ী পারফরম্যান্স</button>
        </div>

        <label className="pl-note">
          লাইভ ভিডিও লিংক
          <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/live/..." />
        </label>
        <button type="button" className="pl-btn primary" disabled={pending} onClick={() => post({ action: "update_meta", videoUrl, status: "live" })}>ভিডিও সেভ + লাইভ করুন</button>

        <label className="pl-note">
          কমেন্টারি
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="যেমন: cover drive চার" />
        </label>

        {msg ? <p className="pl-error">{msg}</p> : null}
        {pending ? <p className="pl-muted">আপডেট হচ্ছে…</p> : null}
      </div>

      {showWicket ? (
        <div className="pl-modal-backdrop">
          <div className="pl-modal-card small">
            <h3>Wicket details</h3>
            <label className="pl-note">
              কে আউট?
              <select value={dismissedPlayerId} onChange={(e) => setDismissedPlayerId(e.target.value)}>
                {[strikerId, nonStrikerId].map((id) => (
                  <option key={id} value={id}>{playerName(id)}</option>
                ))}
              </select>
            </label>
            <label className="pl-note">
              কীভাবে?
              <select value={dismissal} onChange={(e) => setDismissal(e.target.value as (typeof WICKET_TYPES)[number])}>
                {WICKET_TYPES.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </label>
            <div className="pl-actions-row wrap">
              <button type="button" className="pl-btn primary" onClick={submitWicket} disabled={pending}>Confirm W</button>
              <button type="button" className="pl-btn ghost" onClick={() => setShowWicket(false)}>Cancel</button>
            </div>
          </div>
        </div>
      ) : null}

      {showNextBowler ? (
        <div className="pl-modal-backdrop">
          <div className="pl-modal-card small">
            <h3>Next bowler select করুন</h3>
            <label className="pl-note">
              {bowlingTeam.name}
              <select value={bowlerId} onChange={(e) => setBowlerId(e.target.value)}>
                {bowlingPlayers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {roleLabelBn(p.role)}</option>
                ))}
              </select>
            </label>
            <div className="pl-actions-row wrap">
              <button type="button" className="pl-btn primary" onClick={() => { savePlayers(); setShowNextBowler(false); }}>Set bowler</button>
              <button type="button" className="pl-btn ghost" onClick={() => setShowNextBowler(false)}>Later</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

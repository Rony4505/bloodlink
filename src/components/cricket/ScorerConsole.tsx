"use client";

import { useEffect, useState, useTransition } from "react";
import type { BallType, Match } from "@/lib/cricket/types";
import { LiveScoreBoard } from "./LiveScoreBoard";

const RUN_BTNS = [0, 1, 2, 3, 4, 6] as const;

type Props = {
  matchId: string;
  tenantPin: string;
  accent?: string;
  initialMatch: Match;
};

export function ScorerConsole({ matchId, tenantPin, accent, initialMatch }: Props) {
  const [match, setMatch] = useState(initialMatch);
  const [strikerName, setStrikerName] = useState("");
  const [nonStrikerName, setNonStrikerName] = useState("");
  const [bowlerName, setBowlerName] = useState("");
  const [videoUrl, setVideoUrl] = useState(initialMatch.videoUrl || "");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const inn = match.innings[match.currentInningsIndex];
    const s = inn?.batters.find((b) => b.playerId === inn.strikerId);
    const ns = inn?.batters.find((b) => b.playerId === inn.nonStrikerId);
    const bowl = inn?.bowlers.find((b) => b.playerId === inn.bowlerId);
    setStrikerName(s?.name || "");
    setNonStrikerName(ns?.name || "");
    setBowlerName(bowl?.name || "");
    setVideoUrl(match.videoUrl || "");
  }, [match]);

  function post(body: Record<string, unknown>) {
    startTransition(async () => {
      setMsg("");
      try {
        const res = await fetch(`/api/cricket/matches/${matchId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantPin,
            strikerName,
            nonStrikerName,
            bowlerName,
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
        setNote("");
      } catch {
        setMsg("নেটওয়ার্ক সমস্যা");
      }
    });
  }

  function ball(type: BallType, runs: number, isWicket = false) {
    post({ action: "ball", type, runs, isWicket });
  }

  return (
    <div className="pl-scorer">
      <LiveScoreBoard match={match} accent={accent} />

      <div className="pl-scorer-panel">
        <h2>স্কোরার কনসোল</h2>
        <p className="pl-muted">বড় বাটনে ট্যাপ করুন — ভুল হলে Undo চাপুন</p>

        <div className="pl-field-grid">
          <label>
            স্ট্রাইকার
            <input value={strikerName} onChange={(e) => setStrikerName(e.target.value)} placeholder="নাম" />
          </label>
          <label>
            নন-স্ট্রাইক
            <input value={nonStrikerName} onChange={(e) => setNonStrikerName(e.target.value)} placeholder="নাম" />
          </label>
          <label>
            বোলার
            <input value={bowlerName} onChange={(e) => setBowlerName(e.target.value)} placeholder="নাম" />
          </label>
        </div>

        <div className="pl-actions-row">
          <button type="button" className="pl-btn ghost" disabled={pending} onClick={() => post({ action: "set_players" })}>
            নাম সেভ
          </button>
        </div>

        <div className="pl-pad">
          {RUN_BTNS.map((n) => (
            <button key={n} type="button" disabled={pending} onClick={() => ball("run", n)}>
              {n}
            </button>
          ))}
          <button type="button" className="danger" disabled={pending} onClick={() => ball("wicket", 0, true)}>
            W
          </button>
          <button type="button" disabled={pending} onClick={() => ball("wide", 0)}>
            WD
          </button>
          <button type="button" disabled={pending} onClick={() => ball("noball", 0)}>
            NB
          </button>
          <button type="button" disabled={pending} onClick={() => ball("bye", 1)}>
            Bye 1
          </button>
          <button type="button" disabled={pending} onClick={() => ball("legbye", 1)}>
            LB 1
          </button>
        </div>

        <label className="pl-note">
          কমেন্টারি (ঐচ্ছিক)
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="যেমন: ক্যাচ আউট বাউন্ডারিতে" />
        </label>

        <div className="pl-actions-row wrap">
          <button type="button" className="pl-btn" disabled={pending} onClick={() => post({ action: "undo" })}>
            Undo
          </button>
          <button
            type="button"
            className="pl-btn"
            disabled={pending || match.innings.length > 1}
            onClick={() => post({ action: "second_innings" })}
          >
            ২য় ইনিংস
          </button>
          <button type="button" className="pl-btn ghost" disabled={pending} onClick={() => post({ action: "complete" })}>
            ম্যাচ শেষ
          </button>
        </div>

        <label className="pl-note">
          লাইভ ভিডিও লিংক (YouTube / Facebook)
          <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/live/..." />
        </label>
        <button
          type="button"
          className="pl-btn primary"
          disabled={pending}
          onClick={() => post({ action: "update_meta", videoUrl, status: "live" })}
        >
          ভিডিও সেভ + লাইভ করুন
        </button>

        {msg ? <p className="pl-error">{msg}</p> : null}
        {pending ? <p className="pl-muted">আপডেট হচ্ছে…</p> : null}
      </div>
    </div>
  );
}

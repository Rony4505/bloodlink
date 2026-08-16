"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Match } from "@/lib/cricket/types";
import { LiveScoreBoard } from "./LiveScoreBoard";
import { Scorecard } from "./Scorecard";
import { VideoEmbed } from "./VideoEmbed";

type Props = {
  matchId: string;
  slug: string;
  accent?: string;
  initialMatch: Match;
  tenantName: string;
};

export function MatchLiveView({ matchId, slug, accent, initialMatch, tenantName }: Props) {
  const [match, setMatch] = useState(initialMatch);
  const [tab, setTab] = useState<"live" | "card" | "comments">("live");

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch(`/api/cricket/matches/${matchId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (alive && data.match) setMatch(data.match);
      } catch {
        /* ignore */
      }
    };
    const id = window.setInterval(tick, 2000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [matchId]);

  return (
    <div className="pl-live-page">
      <header className="pl-topbar">
        <Link href={`/cricket/t/${slug}`}>{tenantName}</Link>
        <span>PitchLive</span>
      </header>

      <div className="pl-live-grid">
        <VideoEmbed url={match.videoUrl} title={match.title} />
        <LiveScoreBoard match={match} accent={accent} />
      </div>

      <div className="pl-tabs">
        <button type="button" className={tab === "live" ? "on" : ""} onClick={() => setTab("live")}>
          লাইভ
        </button>
        <button type="button" className={tab === "card" ? "on" : ""} onClick={() => setTab("card")}>
          স্কোরকার্ড
        </button>
        <button type="button" className={tab === "comments" ? "on" : ""} onClick={() => setTab("comments")}>
          কমেন্টারি
        </button>
      </div>

      {tab === "live" ? (
        <div className="pl-card-block">
          <h3>এই ওভার</h3>
          <div className="pl-recent">
            <div>
              {(match.innings[match.currentInningsIndex]?.currentOverBalls || []).map((b, i) => (
                <em key={`${b}-${i}`} className={b === "W" ? "is-w" : undefined}>
                  {b}
                </em>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "card" ? <Scorecard match={match} /> : null}

      {tab === "comments" ? (
        <ul className="pl-comments">
          {match.commentary.map((c) => (
            <li key={c.id}>
              <time>{new Date(c.at).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}</time>
              <span>{c.text}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

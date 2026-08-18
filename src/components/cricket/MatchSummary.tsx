"use client";

import { formatScheduleWhen } from "@/lib/cricket/format";
import type { Match } from "@/lib/cricket/types";
import { Scorecard } from "./Scorecard";

type Props = {
  match: Match;
  onClose?: () => void;
  variant?: "modal" | "page";
};

export function MatchSummary({ match, onClose, variant = "modal" }: Props) {
  const res = match.result;

  const body = (
    <div className={`pl-match-summary pl-match-summary-${variant}`}>
      <header className="pl-match-summary-head">
        <h2>{match.title}</h2>
        <p>
          {match.teamA.name} vs {match.teamB.name}
        </p>
        {match.venue ? <p className="pl-muted">{match.venue}</p> : null}
      </header>

      {res ? (
        <div className="pl-match-result-banner">
          {res.winnerSide === "tie" ? (
            <p className="pl-result-main">ম্যাচ টাই</p>
          ) : res.winnerSide === "nr" ? (
            <p className="pl-result-main">ফলাফল নেই (NR)</p>
          ) : (
            <>
              <p className="pl-result-win">
                {res.winnerName} <span>জয়ী</span>
              </p>
              {res.loserName && res.loserName !== "—" ? (
                <p className="pl-result-lose">{res.loserName} পরাজিত</p>
              ) : null}
            </>
          )}
          <p className="pl-result-detail">{res.summaryBn}</p>
          {res.completedAt ? (
            <p className="pl-result-when">সমাপ্ত: {formatScheduleWhen(res.completedAt)}</p>
          ) : null}
        </div>
      ) : null}

      <div className="pl-match-summary-card">
        <Scorecard match={match} />
      </div>

      <div className="pl-actions-row wrap no-print">
        <button type="button" className="pl-btn primary" onClick={() => window.print()}>
          প্রিন্ট / PDF
        </button>
        {onClose ? (
          <button type="button" className="pl-btn ghost" onClick={onClose}>
            বন্ধ
          </button>
        ) : null}
      </div>
    </div>
  );

  if (variant === "modal") {
    return (
      <div className="pl-modal-backdrop pl-match-summary-backdrop">
        <div className="pl-modal-card pl-match-summary-modal">{body}</div>
      </div>
    );
  }

  return body;
}

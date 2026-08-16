"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Match } from "@/lib/cricket/types";
import { MatchLiveView } from "./MatchLiveView";
import "./cricket.css";

export function MatchPageClient({ slug, matchId }: { slug: string; matchId: string }) {
  const [match, setMatch] = useState<Match | null>(null);
  const [tenantName, setTenantName] = useState("");
  const [accent, setAccent] = useState("#0B6E4F");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/cricket/matches/${matchId}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "লোড ব্যর্থ");
        setMatch(data.match);
        setTenantName(data.tenant.name);
        setAccent(data.tenant.brandColor || "#0B6E4F");
      })
      .catch((e: Error) => setError(e.message));
  }, [matchId]);

  if (error) {
    return (
      <div className="pl-shell">
        <div className="pl-live-page">
          <p className="pl-error">{error}</p>
          <Link href={`/cricket/t/${slug}`}>ফিরে যান</Link>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="pl-shell">
        <div className="pl-live-page">
          <p className="pl-muted">লোড হচ্ছে…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pl-shell">
      <MatchLiveView
        matchId={matchId}
        slug={slug}
        accent={accent}
        initialMatch={match}
        tenantName={tenantName}
      />
    </div>
  );
}

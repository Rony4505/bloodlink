"use client";

import { youtubeEmbedUrl } from "@/lib/cricket/engine";
import type { Match, MatchScheduleItem, PlayerRecord, PlayerTeamReport } from "@/lib/cricket/types";
import { StreamGraphicOverlay } from "./StreamGraphicOverlay";

export function VideoEmbed({
  url,
  title,
  match,
  records,
  upcomingMatches,
  playerTeamReports,
}: {
  url: string;
  title: string;
  match?: Match;
  records?: PlayerRecord[];
  upcomingMatches?: MatchScheduleItem[];
  playerTeamReports?: PlayerTeamReport[];
}) {
  const embed = youtubeEmbedUrl(url);
  const overlay = match ? (
    <StreamGraphicOverlay
      match={match}
      records={records}
      upcomingMatches={upcomingMatches}
      playerTeamReports={playerTeamReports}
    />
  ) : null;

  if (!url.trim()) {
    return (
      <div className="pl-video pl-video-empty">
        {overlay}
        <p>লাইভ ভিডিও এখনো যোগ হয়নি</p>
        <span>স্কোরার কনসোল থেকে YouTube/Facebook Live লিংক দিন</span>
      </div>
    );
  }

  if (!embed) {
    return (
      <div className="pl-video pl-video-empty">
        {overlay}
        <p>ভিডিও লিংক খুলুন</p>
        <a href={url} target="_blank" rel="noreferrer">
          {url}
        </a>
      </div>
    );
  }

  return (
    <div className="pl-video">
      <iframe
        src={embed}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
      {overlay}
    </div>
  );
}

"use client";

import { youtubeEmbedUrl } from "@/lib/cricket/engine";
import type { Match } from "@/lib/cricket/types";
import { StreamGraphicOverlay } from "./StreamGraphicOverlay";

export function VideoEmbed({
  url,
  title,
  match,
}: {
  url: string;
  title: string;
  /** When provided, on-stream performance graphics can overlay the video */
  match?: Match;
}) {
  const embed = youtubeEmbedUrl(url);

  if (!url.trim()) {
    return (
      <div className="pl-video pl-video-empty">
        {match ? <StreamGraphicOverlay match={match} /> : null}
        <p>লাইভ ভিডিও এখনো যোগ হয়নি</p>
        <span>স্কোরার কনসোল থেকে YouTube/Facebook Live লিংক দিন</span>
      </div>
    );
  }

  if (!embed) {
    return (
      <div className="pl-video pl-video-empty">
        {match ? <StreamGraphicOverlay match={match} /> : null}
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
      {match ? <StreamGraphicOverlay match={match} /> : null}
    </div>
  );
}

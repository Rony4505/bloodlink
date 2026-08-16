"use client";

import { youtubeEmbedUrl } from "@/lib/cricket/engine";

export function VideoEmbed({ url, title }: { url: string; title: string }) {
  const embed = youtubeEmbedUrl(url);

  if (!url.trim()) {
    return (
      <div className="pl-video pl-video-empty">
        <p>লাইভ ভিডিও এখনো যোগ হয়নি</p>
        <span>স্কোরার কনসোল থেকে YouTube/Facebook Live লিংক দিন</span>
      </div>
    );
  }

  if (!embed) {
    return (
      <div className="pl-video pl-video-empty">
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
    </div>
  );
}

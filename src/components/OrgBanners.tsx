"use client";

import { useEffect, useRef, useState } from "react";
import type { BannerPage, OrgBanner } from "@/lib/types";

type Props = {
  page: BannerPage;
  /** Kept for call-site compatibility; ads always show below hero & above footer. */
  placement?: string;
};

const INTERVAL_MS = 3000;

/**
 * Full-bleed Facebook-cover-style advertisement carousel.
 * Scrolls smoothly every 3s, ping-pong left↔right when multiple ads exist.
 */
export function OrgBanners({ page }: Props) {
  const [banners, setBanners] = useState<OrgBanner[]>([]);
  const [index, setIndex] = useState(0);
  const directionRef = useRef<1 | -1>(1);

  useEffect(() => {
    const params = new URLSearchParams({ page });
    fetch(`/api/banners?${params}`)
      .then((r) => r.json())
      .then((data) => setBanners((data.banners || []).filter((b: OrgBanner) => b.enabled)))
      .catch(() => setBanners([]));
  }, [page]);

  useEffect(() => {
    setIndex(0);
    directionRef.current = 1;
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((current) => {
        const dir = directionRef.current;
        const next = current + dir;
        if (next >= banners.length - 1) {
          directionRef.current = -1;
          return banners.length - 1;
        }
        if (next <= 0) {
          directionRef.current = 1;
          return 0;
        }
        return next;
      });
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [banners.length]);

  if (!banners.length) return null;

  return (
    <section className="w-full border-y border-[var(--line)] bg-[#f4ece6]">
      <div className="relative w-full overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-in-out will-change-transform"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {banners.map((b) => {
            const inner = b.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={b.imageUrl}
                alt={b.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(120deg,#6e1220,#1c0a0c)] px-6 text-center">
                <p className="font-[family-name:var(--font-display)] text-xl font-bold text-white md:text-3xl">
                  {b.title}
                </p>
              </div>
            );

            const frame = (
              <div className="aspect-[820/312] w-full min-h-[7.5rem] sm:min-h-[9.5rem] md:min-h-[12rem]">
                {inner}
              </div>
            );

            return b.linkUrl ? (
              <a
                key={b.id}
                href={b.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full shrink-0"
              >
                {frame}
              </a>
            ) : (
              <div key={b.id} className="w-full shrink-0">
                {frame}
              </div>
            );
          })}
        </div>

        {banners.length > 1 ? (
          <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {banners.map((b, i) => (
              <span
                key={b.id}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-5 bg-white shadow" : "w-1.5 bg-white/55"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

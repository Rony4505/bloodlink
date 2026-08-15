"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import type { BannerPage, OrgBanner } from "@/lib/types";

type Props = {
  page: BannerPage;
  /** Kept for call-site compatibility; ads always show below hero & above footer. */
  placement?: string;
};

const INTERVAL_MS = 3000;

const bannerCache = new Map<string, Promise<OrgBanner[]>>();

function loadBanners(page: BannerPage): Promise<OrgBanner[]> {
  const cached = bannerCache.get(page);
  if (cached) return cached;
  const params = new URLSearchParams({ page });
  const promise = fetch(`/api/banners?${params}`)
    .then((r) => r.json())
    .then((data) =>
      ((data.banners || []) as OrgBanner[]).filter((b) => b.enabled),
    )
    .catch(() => [] as OrgBanner[]);
  bannerCache.set(page, promise);
  return promise;
}

/**
 * Full-bleed wide advertisement carousel (820×150).
 * Scrolls smoothly every 3s, ping-pong left↔right when multiple ads exist.
 */
export function OrgBanners({ page }: Props) {
  const { t } = useLocale();
  const [banners, setBanners] = useState<OrgBanner[]>([]);
  const [index, setIndex] = useState(0);
  const directionRef = useRef<1 | -1>(1);

  useEffect(() => {
    let alive = true;
    void loadBanners(page).then((list) => {
      if (alive) setBanners(list);
    });
    return () => {
      alive = false;
    };
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
    <section
      aria-label={t.orgBannerPublicLabel}
      className="w-full border-y border-[var(--line)] bg-[#f4ece6]"
    >
      <div className="flex items-center justify-between border-b border-[color-mix(in_oklab,var(--line)_80%,var(--ink)_20%)] bg-[color-mix(in_oklab,#f4ece6_70%,white)] px-4 py-2 sm:px-6">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[color-mix(in_oklab,var(--ink)_65%,white)]">
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full bg-[var(--accent)]"
          />
          {t.orgBannerPublicLabel}
        </span>
        <span className="rounded-full border border-[color-mix(in_oklab,var(--ink)_18%,white)] bg-white/70 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[color-mix(in_oklab,var(--ink)_55%,white)]">
          {t.orgBannerSponsored}
        </span>
      </div>

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
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(120deg,#6e1220,#1c0a0c)] px-6 text-center">
                <p className="font-[family-name:var(--font-display)] text-xl font-bold text-white md:text-3xl">
                  {b.title}
                </p>
              </div>
            );

            const frame = (
              <div className="aspect-[820/150] w-full min-h-[3.5rem] sm:min-h-[4.5rem] md:min-h-[5.5rem]">
                {inner}
              </div>
            );

            return b.linkUrl ? (
              <a
                key={b.id}
                href={b.linkUrl}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="block w-full shrink-0"
                aria-label={`${t.orgBannerPublicLabel}: ${b.title}`}
              >
                {frame}
              </a>
            ) : (
              <div key={b.id} className="w-full shrink-0" role="group" aria-label={b.title}>
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

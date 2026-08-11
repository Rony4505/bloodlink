"use client";

import { useEffect, useState } from "react";
import { BANNER_SIZE_CLASS } from "@/lib/site-cms";
import type { BannerPage, BannerPlacement, BannerSize, OrgBanner } from "@/lib/types";

type Props = {
  page: BannerPage;
  placement: BannerPlacement;
};

export function OrgBanners({ page, placement }: Props) {
  const [banners, setBanners] = useState<OrgBanner[]>([]);

  useEffect(() => {
    const params = new URLSearchParams({ page, placement });
    fetch(`/api/banners?${params}`)
      .then((r) => r.json())
      .then((data) => setBanners(data.banners || []))
      .catch(() => setBanners([]));
  }, [page, placement]);

  if (!banners.length) return null;

  return (
    <section className="border-t border-[var(--line)] bg-white px-5 py-8 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-4">
        {banners.map((b) => {
          const size = (b.size || "md") as BannerSize;
          const sizeClass = BANNER_SIZE_CLASS[size] || BANNER_SIZE_CLASS.md;
          const inner = b.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={b.imageUrl}
              alt={b.title}
              className={`${sizeClass} object-contain`}
            />
          ) : (
            <span className="px-4 py-3 text-sm font-semibold">{b.title}</span>
          );
          return b.linkUrl ? (
            <a
              key={b.id}
              href={b.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--sand)_20%,white)] px-3 py-2 transition hover:opacity-90"
            >
              {inner}
            </a>
          ) : (
            <div
              key={b.id}
              className="rounded-xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--sand)_20%,white)] px-3 py-2"
            >
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}

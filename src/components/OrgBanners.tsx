"use client";

import { useEffect, useState } from "react";

type Banner = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
};

export function OrgBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    fetch("/api/banners")
      .then((r) => r.json())
      .then((data) => setBanners(data.banners || []))
      .catch(() => setBanners([]));
  }, []);

  if (!banners.length) return null;

  return (
    <section className="border-t border-[var(--line)] bg-white px-5 py-10 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-4">
        {banners.map((b) => {
          const inner = b.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={b.imageUrl}
              alt={b.title}
              className="h-16 max-w-[220px] object-contain"
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

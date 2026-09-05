"use client";

import Link from "next/link";
import type { AdPlacement } from "@/lib/kajmama/types";
import { useKm } from "./KmSession";

export function KmAdSlot({ placement }: { placement: AdPlacement }) {
  const { lang, meta } = useKm();
  const ads = meta.ads.filter((a) => a.placement === placement);
  if (!ads.length) return null;
  const bn = lang === "bn";
  return (
    <div className="km-ad-stack">
      {ads.map((ad) => {
        const inner = (
          <article className="km-ad-premium">
            {ad.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ad.imageUrl} alt="" />
            ) : null}
            <div>
              <span className="km-ad-kicker">AD · KajMama</span>
              <h3>{ad.title}</h3>
              <p>{ad.subtitle}</p>
              <em>{bn ? ad.ctaBn : ad.ctaEn}</em>
            </div>
          </article>
        );
        if (ad.href.startsWith("http")) {
          return (
            <a key={ad.id} href={ad.href} target="_blank" rel="noreferrer" className="km-ad-link">
              {inner}
            </a>
          );
        }
        return (
          <Link key={ad.id} href={ad.href || "/kajmama"} className="km-ad-link">
            {inner}
          </Link>
        );
      })}
    </div>
  );
}

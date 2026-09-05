"use client";

import Link from "next/link";
import { avatarTone, initials, photoUrlFor, taka, takaEn } from "@/lib/kajmama/format";
import { useKm } from "./KmSession";

export function KmLogoMark({ size = 42 }: { size?: number }) {
  return (
    <span className="km-logo-mark" style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 48 48" width={size * 0.72} height={size * 0.72}>
        <circle cx="24" cy="24" r="22" fill="#0f3d3e" />
        <path d="M14 20h20l-2-6H16z" fill="#ff8a00" />
        <rect x="21" y="14" width="6" height="4" rx="1" fill="#ffb04a" />
        <circle cx="24" cy="28" r="7" fill="#fff" />
        <path d="M16 42c1.5-7 5.5-10 8-10s6.5 3 8 10" fill="#fff" />
      </svg>
    </span>
  );
}

export function KmAvatar({ name, size = 44, id }: { name: string; size?: number; id?: string }) {
  const src = id ? photoUrlFor(id) : undefined;
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote portraits; no next/image remotePatterns for KajMama
      <img
        className="km-avatar"
        src={src}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: "cover" }}
      />
    );
  }
  return (
    <span
      className="km-avatar"
      style={{ width: size, height: size, fontSize: size * 0.32, background: avatarTone(name) }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function KmStars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <span className="km-stars" aria-label={`${value} stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= full ? "on" : ""}>
          ★
        </span>
      ))}
    </span>
  );
}

export function KmMoney({ amount }: { amount: number }) {
  const { lang } = useKm();
  return <span className="km-money">{lang === "bn" ? taka(amount) : takaEn(amount)}</span>;
}

export function KmVerified({ on }: { on: boolean }) {
  if (!on) return null;
  return (
    <span className="km-check" title="Verified" aria-label="Verified">
      ✓
    </span>
  );
}

export function KmPremium({ on }: { on: boolean }) {
  if (!on) return null;
  return <span className="km-premium">PREMIUM</span>;
}

export function KmSkill({ id }: { id: string }) {
  const { lang, meta } = useKm();
  const cat = meta.categories.find((c) => c.id === id);
  if (!cat) return null;
  return <span className="km-chip">{lang === "bn" ? cat.nameBn : cat.nameEn}</span>;
}

export function KmEmpty({ title, hint, href, cta }: { title: string; hint: string; href?: string; cta?: string }) {
  return (
    <div className="km-empty">
      <h3>{title}</h3>
      <p>{hint}</p>
      {href && cta ? (
        <Link href={href} className="km-btn gold">
          {cta}
        </Link>
      ) : null}
    </div>
  );
}

export function KmStatus({ status }: { status: string }) {
  const { lang } = useKm();
  const map: Record<string, { bn: string; en: string }> = {
    open: { bn: "খোলা", en: "Open" },
    assigned: { bn: "অ্যাসাইন", en: "Assigned" },
    pending: { bn: "অপেক্ষমাণ", en: "Pending" },
    accepted: { bn: "গ্রহণ", en: "Accepted" },
    declined: { bn: "না", en: "Declined" },
    in_progress: { bn: "চলছে", en: "In progress" },
    completed: { bn: "পেমেন্ট বাকি", en: "Awaiting payment" },
    paid: { bn: "পেইড", en: "Paid" },
    cancelled: { bn: "বাতিল", en: "Cancelled" },
  };
  const label = map[status] || { bn: status, en: status };
  return <span className={`km-status s-${status}`}>{lang === "bn" ? label.bn : label.en}</span>;
}

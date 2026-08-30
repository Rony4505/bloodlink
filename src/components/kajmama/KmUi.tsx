"use client";

import Link from "next/link";
import { avatarTone, initials, taka, takaEn } from "@/lib/kajmama/format";
import { categoryById } from "@/lib/kajmama/constants";
import { useKm } from "./KmSession";

export function KmAvatar({ name, size = 44 }: { name: string; size?: number }) {
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
  const { lang } = useKm();
  if (!on) return null;
  return <span className="km-badge gold">{lang === "bn" ? "ভেরিফায়েড" : "Verified"}</span>;
}

export function KmSkill({ id }: { id: string }) {
  const { lang } = useKm();
  const cat = categoryById(id);
  if (!cat) return null;
  return (
    <span className="km-chip">
      {cat.icon} {lang === "bn" ? cat.nameBn : cat.nameEn}
    </span>
  );
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
    completed: { bn: "শেষ", en: "Done" },
    cancelled: { bn: "বাতিল", en: "Cancelled" },
  };
  const label = map[status] || { bn: status, en: status };
  return <span className={`km-status s-${status}`}>{lang === "bn" ? label.bn : label.en}</span>;
}

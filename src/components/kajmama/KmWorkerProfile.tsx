"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { KAJMAMA_BASE } from "@/lib/kajmama/constants";
import { kmApi } from "@/lib/kajmama/client";
import { timeAgo } from "@/lib/kajmama/format";
import type { PublicUser } from "@/lib/kajmama/types";
import { useKm } from "./KmSession";
import { KmAvatar, KmMoney, KmSkill, KmStars, KmVerified } from "./KmUi";

type Review = { id: string; rating: number; text: string; createdAt: string; fromName: string };

export function KmWorkerProfile() {
  const { id } = useParams<{ id: string }>();
  const { lang, user } = useKm();
  const bn = lang === "bn";
  const router = useRouter();
  const [worker, setWorker] = useState<PublicUser | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [canHire, setCanHire] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    kmApi<{ worker: PublicUser; reviews: Review[]; canHire: boolean }>(`/api/kajmama/workers/${id}`)
      .then((d) => {
        setWorker(d.worker);
        setReviews(d.reviews);
        setCanHire(d.canHire);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "লোড হয়নি"));
  }, [id]);

  if (error) {
    return (
      <div className="km-page km-wrap">
        <p className="km-error">{error}</p>
      </div>
    );
  }
  if (!worker) {
    return (
      <div className="km-page km-wrap">
        <p className="km-muted">{bn ? "লোড হচ্ছে…" : "Loading…"}</p>
      </div>
    );
  }

  return (
    <div className="km-page km-wrap km-profile">
      <article className="km-card">
        <div className="km-worker-top">
          <KmAvatar name={worker.name} size={64} />
          <div>
            <h1 style={{ margin: 0, fontSize: "1.8rem" }}>{worker.name}</h1>
            <p className="km-meta">
              {worker.area}, {worker.district} · {worker.experienceYears}
              {bn ? " বছরের অভিজ্ঞতা" : " years"}
            </p>
            <KmVerified on={worker.verified} />
          </div>
        </div>
        <p style={{ marginTop: "1rem", lineHeight: 1.6 }}>{worker.bio}</p>
        <div className="km-chips" style={{ marginTop: "0.8rem" }}>
          {worker.skills.map((s) => (
            <KmSkill key={s} id={s} />
          ))}
        </div>
        <div className="km-worker-foot" style={{ marginTop: "1.2rem" }}>
          <span>
            <KmStars value={worker.rating} /> {worker.reviewCount}
          </span>
          <span>
            {bn ? "কাজ" : "Job"} <KmMoney amount={worker.jobRate} /> · {bn ? "ঘণ্টা" : "hr"}{" "}
            <KmMoney amount={worker.hourlyRate} />
          </span>
        </div>
        {worker.phone ? <p className="km-hint">{bn ? "ফোন" : "Phone"}: {worker.phone}</p> : null}

        <h3 style={{ marginTop: "1.6rem" }}>{bn ? "রিভিউ" : "Reviews"}</h3>
        {reviews.length === 0 ? (
          <p className="km-muted">{bn ? "এখনো রিভিউ নেই।" : "No reviews yet."}</p>
        ) : (
          <div className="km-list">
            {reviews.map((r) => (
              <div key={r.id} className="km-card" style={{ padding: "0.8rem" }}>
                <KmStars value={r.rating} />
                <p style={{ margin: "0.35rem 0 0" }}>{r.text}</p>
                <p className="km-meta">
                  {r.fromName} · {timeAgo(r.createdAt, bn)}
                </p>
              </div>
            ))}
          </div>
        )}
      </article>
      <aside className="km-card">
        <h3>{bn ? "হায়ার করুন" : "Hire"}</h3>
        <p className="km-muted">
          {bn
            ? "বুকিং কনফার্মের আগে নম্বর দেখাবে না। চ্যাট করে কাজ ঠিক করুন।"
            : "Phone stays hidden until the booking is accepted."}
        </p>
        {canHire ? (
          <Link
            className="km-btn gold"
            href={`${KAJMAMA_BASE}/jobs/new?worker=${worker.id}&category=${worker.skills[0] || ""}`}
          >
            {bn ? "এই মামাকে হায়ার" : "Hire this person"}
          </Link>
        ) : user ? (
          <p className="km-muted">
            {bn ? "হায়ার করতে কাজদাতা অ্যাকাউন্ট লাগবে।" : "A hirer account is needed to hire."}
          </p>
        ) : (
          <button type="button" className="km-btn gold" onClick={() => router.push(`${KAJMAMA_BASE}/login`)}>
            {bn ? "লগইন করে হায়ার" : "Log in to hire"}
          </button>
        )}
      </aside>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { useLocale } from "@/lib/i18n/locale-context";

type PostDetail = {
  id: string;
  posterName: string;
  patientName: string;
  relation: string;
  bloodGroup: string;
  unitsNeeded: number;
  district: string;
  area: string;
  hospital: string;
  neededBy: string;
  message: string;
  createdAt: string;
  phoneMasked: string;
  contactPhone: string | null;
  canContact: boolean;
  contactBlockedReason: string | null;
};

export default function RequestDetailPage() {
  const { t } = useLocale();
  const params = useParams<{ id: string }>();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/posts/${params.id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || t.errorGeneric);
          return;
        }
        setPost(data.post);
      })
      .catch(() => setError(t.errorGeneric));
  }, [params.id, t.errorGeneric]);

  const blockMessage =
    post?.contactBlockedReason === "login_required"
      ? t.loginToContact
      : post?.contactBlockedReason === "blood_mismatch"
        ? t.bloodMismatch
        : post?.contactBlockedReason === "not_available"
          ? t.notAvailableNow
          : post?.contactBlockedReason === "blood_issue"
            ? t.bloodIssueBlock
            : null;

  return (
    <PageShell title={t.postDetails} subtitle={t.requestsSubtitle}>
      <div className="mx-auto max-w-2xl rounded-2xl bg-white/80 p-6 md:p-8">
        {error ? <p className="text-[var(--blood)]">{error}</p> : null}
        {!post && !error ? <p>{t.loading}</p> : null}
        {post ? (
          <div className="space-y-3 text-sm md:text-base">
            <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--blood-deep)]">
              {post.bloodGroup} · {post.unitsNeeded} bag
            </p>
            <p>
              <strong>{t.patientName}:</strong> {post.patientName}
            </p>
            <p>
              <strong>{t.posterName}:</strong> {post.posterName} ({post.relation})
            </p>
            <p>
              <strong>{t.hospital}:</strong> {post.hospital}
            </p>
            <p>
              <strong>{t.area}:</strong> {post.area}, {post.district}
            </p>
            <p>
              <strong>{t.neededBy}:</strong> {post.neededBy}
            </p>
            <p>
              <strong>{t.message}:</strong> {post.message}
            </p>
            <p>
              <strong>{t.phone}:</strong>{" "}
              {post.contactPhone || post.phoneMasked}
            </p>

            {post.canContact && post.contactPhone ? (
              <a href={`tel:${post.contactPhone}`} className="btn-primary mt-4 inline-flex">
                {t.contactSeeker}: {post.contactPhone}
              </a>
            ) : (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-[var(--blood-deep)]">{blockMessage}</p>
                {post.contactBlockedReason === "login_required" ? (
                  <Link href="/login" className="btn-primary inline-flex">
                    {t.login}
                  </Link>
                ) : null}
                {post.contactBlockedReason === "not_available" ? (
                  <Link href="/dashboard" className="btn-ghost inline-flex">
                    {t.dashboard}
                  </Link>
                ) : null}
              </div>
            )}

            <Link href="/requests" className="btn-ghost mt-4 inline-flex">
              {t.requestsTitle}
            </Link>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}

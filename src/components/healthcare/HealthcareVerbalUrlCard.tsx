"use client";

import { useLocale } from "@/lib/i18n/locale-context";
import { healthcareVerbalLink } from "@/lib/healthcare-urls";

type Props = {
  token: string;
  origin?: string;
  compact?: boolean;
};

export function HealthcareVerbalUrlCard({ token, origin, compact }: Props) {
  const { t } = useLocale();
  const link = healthcareVerbalLink(
    token,
    origin || (typeof window !== "undefined" ? window.location.origin : undefined),
  );

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(link.url);
    } catch {
      window.prompt(t.volunteerCopyUrl, link.url);
    }
  }

  async function shareUrl() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "BloodLink BD",
          text: `${link.host} / ${link.path} — ${link.code}`,
          url: link.url,
        });
        return;
      } catch {
        // fall through
      }
    }
    void copyUrl();
  }

  return (
    <div
      className={`rounded-xl border border-[var(--line)] bg-[var(--cream)]/70 ${compact ? "p-3" : "p-4"}`}
    >
      <p className="text-sm font-semibold text-[var(--blood-deep)]">
        {t.healthcarePortalUrlLabel}
      </p>
      {!compact ? (
        <p className="mt-1 text-xs text-[color-mix(in_oklab,var(--ink)_58%,white)]">
          {t.healthcarePortalUrlHint}
        </p>
      ) : null}
      <div className="mt-3 space-y-2 text-sm">
        <p>
          <span className="font-medium text-[var(--ink)]">{t.volunteerVerbalSite}: </span>
          <span className="font-mono">{link.host}</span>
        </p>
        <p>
          <span className="font-medium text-[var(--ink)]">{t.volunteerVerbalPath}: </span>
          <span className="font-mono">{link.path}</span>
        </p>
        <p>
          <span className="font-medium text-[var(--ink)]">{t.volunteerVerbalCode}: </span>
          <span className="font-mono text-base tracking-wide text-[var(--blood-deep)]">
            {link.code}
          </span>
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn-ghost px-3 py-1 text-xs" onClick={() => void copyUrl()}>
          {t.volunteerCopyUrl}
        </button>
        <button type="button" className="btn-primary px-3 py-1 text-xs" onClick={() => void shareUrl()}>
          {t.volunteerShareUrl}
        </button>
        <a className="btn-ghost px-3 py-1 text-xs" href={link.url} target="_blank" rel="noreferrer">
          {t.volunteerOpenUrl}
        </a>
      </div>
    </div>
  );
}

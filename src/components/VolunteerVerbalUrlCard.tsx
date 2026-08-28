"use client";

import { useLocale } from "@/lib/i18n/locale-context";
import { volunteerVerbalLink, type VolunteerVerbalLink } from "@/lib/volunteer-urls";

type Props = {
  kind: "join" | "work";
  token: string;
  origin?: string;
  compact?: boolean;
};

export function VolunteerVerbalUrlCard({ kind, token, origin, compact }: Props) {
  const { t } = useLocale();
  const link: VolunteerVerbalLink = volunteerVerbalLink(
    kind,
    token,
    origin || (typeof window !== "undefined" ? window.location.origin : undefined),
  );

  const title =
    kind === "join" ? t.volunteerDonorUrlLabel : t.volunteerWorkUrlLabel;
  const hint =
    kind === "join" ? t.volunteerVerbalJoinHint : t.volunteerVerbalWorkHint;

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
        // fall through to copy
      }
    }
    void copyUrl();
  }

  return (
    <div className={`rounded-xl border border-[var(--line)] bg-[var(--cream)]/70 ${compact ? "p-3" : "p-4"}`}>
      <p className="text-sm font-semibold text-[var(--blood-deep)]">{title}</p>
      {!compact ? (
        <p className="mt-1 text-xs text-[color-mix(in_oklab,var(--ink)_58%,white)]">{hint}</p>
      ) : null}
      <div className="mt-3 space-y-2 text-sm">
        <p>
          <span className="font-medium text-[var(--ink)]">{t.volunteerVerbalSite}: </span>
          <span className="font-mono">{link.host}</span>
        </p>
        <p>
          <span className="font-medium text-[var(--ink)]">{t.volunteerVerbalPath}: </span>
          <span className="font-mono uppercase">{link.path}</span>
        </p>
        <p>
          <span className="font-medium text-[var(--ink)]">{t.volunteerVerbalCode}: </span>
          <span className="font-mono text-base tracking-wide text-[var(--blood-deep)]">
            {link.code}
          </span>
        </p>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-[color-mix(in_oklab,var(--ink)_55%,white)]">
        {t.volunteerVerbalSay.replace("{host}", link.host).replace("{path}", link.path)}
      </p>
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

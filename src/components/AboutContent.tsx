"use client";

import Image from "next/image";
import { useSiteAppearance } from "@/components/SiteAppearanceProvider";
import { useLocale } from "@/lib/i18n/locale-context";

/** CMS about text sometimes still embeds founder lines; UI shows founder separately. */
function missionText(body: string) {
  const cut = body.search(
    /\n+(Founder|প্রতিষ্ঠাতা|Founder:|তৈরি করেছেন)\b/i,
  );
  return (cut >= 0 ? body.slice(0, cut) : body).trim();
}

export function AboutContent({ compact = false }: { compact?: boolean }) {
  const { t } = useLocale();
  const { aboutTitle, aboutBody, appearance } = useSiteAppearance();
  const mission = missionText(aboutBody);
  const photoUrl = appearance.founderPhotoUrl?.trim() || "";
  const hasEmbeddedSections =
    /Our Vision|আমাদের ভিশন|Our Mission|আমাদের মিশন/i.test(mission);

  return (
    <div className={compact ? "space-y-8" : "space-y-6"}>
      {!compact ? (
        <div className="rounded-2xl bg-white/90 p-6 shadow-[0_12px_40px_rgba(62,20,28,0.06)] md:p-8">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--blood-deep)] md:text-3xl">
            {aboutTitle}
          </h2>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-[color-mix(in_oklab,var(--ink)_78%,white)] whitespace-pre-line">
            {mission}
          </div>
          {!hasEmbeddedSections ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--blood-deep)]">
                  {t.aboutVisionTitle}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[color-mix(in_oklab,var(--ink)_75%,white)] md:text-base">
                  {t.aboutVisionBody}
                </p>
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--blood-deep)]">
                  {t.aboutMissionTitle}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[color-mix(in_oklab,var(--ink)_75%,white)] md:text-base">
                  {t.aboutMissionBody}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--blood-deep)] md:text-4xl">
            {aboutTitle}
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-[color-mix(in_oklab,var(--ink)_75%,white)] whitespace-pre-line">
            {mission}
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-white/90 shadow-[0_12px_40px_rgba(62,20,28,0.06)]">
        <div className="grid gap-0 md:grid-cols-[minmax(0,200px)_1fr]">
          <div className="relative flex items-center justify-center bg-[linear-gradient(160deg,#6e1220_0%,#9b1b2e_55%,#3d1a1f_100%)] p-6 md:min-h-[220px]">
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt={t.creatorName}
                width={180}
                height={180}
                className="h-36 w-36 rounded-full object-cover ring-4 ring-white/30 md:h-40 md:w-40"
                unoptimized={photoUrl.startsWith("/api/") || photoUrl.startsWith("http")}
              />
            ) : (
              <div
                className="flex h-36 w-36 items-center justify-center rounded-full bg-white/15 text-4xl font-bold tracking-wide text-white ring-4 ring-white/25 md:h-40 md:w-40 font-[family-name:var(--font-display)]"
                aria-hidden
              >
                TR
              </div>
            )}
          </div>
          <div className="p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color-mix(in_oklab,var(--blood)_70%,black)]">
              {t.founderLabel}
            </p>
            <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--blood-deep)]">
              {t.creatorName}
            </h3>
            <p className="mt-1 text-sm text-[color-mix(in_oklab,var(--ink)_65%,white)]">
              {t.founderRole}
            </p>
            <dl className="mt-5 space-y-3 text-sm md:text-base">
              <div>
                <dt className="font-semibold text-[var(--ink)]">{t.creatorAddressLabel}</dt>
                <dd className="mt-0.5 text-[color-mix(in_oklab,var(--ink)_75%,white)]">
                  {t.creatorAddress}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--ink)]">{t.contactNumber}</dt>
                <dd className="mt-0.5">
                  <a
                    href="tel:+8801711934505"
                    className="text-[var(--blood-deep)] underline-offset-4 hover:underline"
                  >
                    {t.creatorPhone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--ink)]">{t.creatorEmailLabel}</dt>
                <dd className="mt-0.5">
                  <a
                    href={`mailto:${t.creatorEmail}`}
                    className="text-[var(--blood-deep)] underline-offset-4 hover:underline"
                  >
                    {t.creatorEmail}
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useLocale } from "@/lib/i18n/locale-context";

export function VerifiedBadge({
  verified,
  emailVerified,
  phoneVerified,
  compact = false,
}: {
  verified: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  compact?: boolean;
}) {
  const { t } = useLocale();

  if (!verified) {
    return (
      <span className="rounded-md bg-[color-mix(in_oklab,var(--ink)_8%,white)] px-2 py-0.5 text-xs font-semibold text-[color-mix(in_oklab,var(--ink)_55%,white)]">
        {t.notVerified}
      </span>
    );
  }

  const via =
    emailVerified && phoneVerified
      ? t.verifiedBoth
      : emailVerified
        ? t.verifiedEmail
        : phoneVerified
          ? t.verifiedPhone
          : t.verifiedId;

  return (
    <span
      className="rounded-md bg-[color-mix(in_oklab,var(--sage)_18%,white)] px-2 py-0.5 text-xs font-semibold text-[var(--sage)]"
      title={via}
    >
      {compact ? t.verifiedId : via}
    </span>
  );
}

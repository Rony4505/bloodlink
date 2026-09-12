import type { ReferralSettings } from "@/lib/types";

export const DEFAULT_MAX_SUCCESSFUL_REFS = 30;
export const DEFAULT_MIN_SUCCESSFUL_FOR_WITHDRAW = 15;

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Short unique-looking referral code (e.g. BL7K2M9Q). */
export function generateReferralCode(): string {
  let out = "BL";
  for (let i = 0; i < 6; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

/**
 * Detect common in-app browsers / WebViews where push + referral attribution
 * must not credit (WhatsApp, Facebook, Instagram, Telegram, Line, Viber, Messenger).
 */
export function isInAppBrowser(ua: string): boolean {
  const s = String(ua || "");
  if (!s) return false;
  return (
    /FBAN|FBAV/i.test(s) ||
    /Instagram/i.test(s) ||
    /Line\//i.test(s) ||
    /WhatsApp/i.test(s) ||
    /Telegram/i.test(s) ||
    /Viber/i.test(s) ||
    /Messenger/i.test(s) ||
    /; wv\)/i.test(s) ||
    /WV\//i.test(s)
  );
}

/** True when settings.enabled and now is inside the optional campaign window. */
export function isCampaignActive(
  settings: Pick<
    ReferralSettings,
    "enabled" | "campaignStartAt" | "campaignEndAt"
  >,
  now: Date | number = Date.now(),
): boolean {
  if (!settings.enabled) return false;
  const t = typeof now === "number" ? now : now.getTime();
  const startRaw = String(settings.campaignStartAt || "").trim();
  const endRaw = String(settings.campaignEndAt || "").trim();
  if (startRaw) {
    const start = Date.parse(startRaw);
    if (Number.isFinite(start) && t < start) return false;
  }
  if (endRaw) {
    const end = Date.parse(endRaw);
    if (Number.isFinite(end) && t > end) return false;
  }
  return true;
}
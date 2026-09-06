/**
 * BloodLink push system rebuild version.
 * Bumping this clears stale pushSubscriptions once on the server and
 * forces every browser to re-Allow so deliveries work again.
 */
export const PUSH_SYSTEM_VERSION = 3;

/** localStorage / sessionStorage keys used by older prompt builds */
export const LEGACY_PUSH_STORAGE_KEYS = [
  "bloodlink_push_accepted",
  "bloodlink_push_on",
  "bloodlink_push_snooze_until",
  "bloodlink_admin_push_dismissed",
  "bloodlink_admin_push_snooze",
  "bloodlink_admin_push_asked_session",
  "bloodlink_push_asked_this_session",
  "bloodlink_push_auto_try",
  "bloodlink_push_prompt_v",
] as const;

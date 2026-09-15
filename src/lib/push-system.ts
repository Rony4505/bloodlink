/**
 * BloodLink push system rebuild version.
 * Bump to clear stale prompt flags / subscriptions after a push UX rebuild.
 */
export const PUSH_SYSTEM_VERSION = 6;

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
  "bloodlink_push_snooze_until_v3",
  "bloodlink_push_asked_session_v3",
  "bloodlink_push_accepted_v3",
  "bloodlink_push_denied_reload",
  "bloodlink_push_sw_reload",
] as const;

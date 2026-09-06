import { PUSH_SYSTEM_VERSION, LEGACY_PUSH_STORAGE_KEYS } from "@/lib/push-system";

const SNOOZE_KEY = "bloodlink_push_snooze_until_v3";
const SESSION_ASKED_KEY = "bloodlink_push_asked_session_v3";
const ACCEPTED_KEY = "bloodlink_push_accepted_v3";
const VERSION_KEY = "bloodlink_push_prompt_v";

/** One-time wipe of old broken "accepted/dismissed" flags so everyone is asked again. */
export function migratePushPromptStorage(): void {
  if (typeof window === "undefined") return;
  const current = localStorage.getItem(VERSION_KEY);
  if (current === String(PUSH_SYSTEM_VERSION)) return;
  for (const key of LEGACY_PUSH_STORAGE_KEYS) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
  localStorage.removeItem(SNOOZE_KEY);
  localStorage.removeItem(ACCEPTED_KEY);
  sessionStorage.removeItem(SESSION_ASKED_KEY);
  localStorage.setItem(VERSION_KEY, String(PUSH_SYSTEM_VERSION));
}

export function isPushPromptSnoozed(): boolean {
  if (typeof window === "undefined") return true;
  migratePushPromptStorage();
  const until = localStorage.getItem(SNOOZE_KEY);
  if (!until) return false;
  const ts = Date.parse(until);
  if (!Number.isFinite(ts) || Date.now() >= ts) {
    localStorage.removeItem(SNOOZE_KEY);
    return false;
  }
  return true;
}

/** Short pause only (hard browser deny). "Not now" must not use a long snooze. */
export function snoozePushPrompt(days = 1): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    SNOOZE_KEY,
    new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
  );
}

export function clearPushPromptSnooze(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SNOOZE_KEY);
}

export function hasAcceptedPushPrompt(): boolean {
  if (typeof window === "undefined") return false;
  migratePushPromptStorage();
  return localStorage.getItem(ACCEPTED_KEY) === "1";
}

export function markPushPromptAccepted(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCEPTED_KEY, "1");
  clearPushPromptSnooze();
}

export function clearPushPromptAccepted(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCEPTED_KEY);
}

export function wasPushPromptShownThisSession(): boolean {
  if (typeof window === "undefined") return true;
  migratePushPromptStorage();
  return sessionStorage.getItem(SESSION_ASKED_KEY) === "1";
}

export function markPushPromptShownThisSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_ASKED_KEY, "1");
}

/**
 * Local hint only — server deliverable subscription is the source of truth.
 * After rebuild, accepted is only set when subscribe actually succeeded.
 */
export function shouldSkipPushPrompt(): boolean {
  if (typeof window === "undefined") return true;
  migratePushPromptStorage();
  return hasAcceptedPushPrompt();
}

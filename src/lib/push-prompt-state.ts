const SNOOZE_KEY = "bloodlink_push_snooze_until";
const SESSION_ASKED_KEY = "bloodlink_push_asked_this_session";
const AUTO_TRY_KEY = "bloodlink_push_auto_try";

export function isPushPromptSnoozed(): boolean {
  if (typeof window === "undefined") return true;
  const until = localStorage.getItem(SNOOZE_KEY);
  if (!until) return false;
  const ts = Date.parse(until);
  if (!Number.isFinite(ts) || Date.now() >= ts) {
    localStorage.removeItem(SNOOZE_KEY);
    return false;
  }
  return true;
}

/** User chose "Not now" — hide the modal for a while. */
export function snoozePushPrompt(days = 30): void {
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

export function wasPushPromptShownThisSession(): boolean {
  if (typeof window === "undefined") return true;
  return sessionStorage.getItem(SESSION_ASKED_KEY) === "1";
}

export function markPushPromptShownThisSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_ASKED_KEY, "1");
}

export function shouldAutoTryPushSubscribe(): boolean {
  if (typeof window === "undefined") return false;
  if (sessionStorage.getItem(AUTO_TRY_KEY) === "1") return false;
  sessionStorage.setItem(AUTO_TRY_KEY, "1");
  return true;
}

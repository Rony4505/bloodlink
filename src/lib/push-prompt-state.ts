const SNOOZE_KEY = "bloodlink_push_snooze_until";
const SESSION_ASKED_KEY = "bloodlink_push_asked_this_session";
const AUTO_TRY_KEY = "bloodlink_push_auto_try";
/** User successfully enabled push (deliverable or iOS permission-only). */
const ACCEPTED_KEY = "bloodlink_push_accepted";

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

/**
 * Temporary hide only (e.g. browser hard-denied).
 * "Not now" must NOT use a long snooze — ask again on every new login.
 */
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

/** True after a successful Allow on this browser (local hint only). */
export function hasAcceptedPushPrompt(): boolean {
  if (typeof window === "undefined") return false;
  return (
    localStorage.getItem(ACCEPTED_KEY) === "1" ||
    localStorage.getItem("bloodlink_push_on") === "1"
  );
}

export function markPushPromptAccepted(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCEPTED_KEY, "1");
  localStorage.setItem("bloodlink_push_on", "1");
  clearPushPromptSnooze();
}

/** Clear false "accepted" so we keep asking until real push is on. */
export function clearPushPromptAccepted(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCEPTED_KEY);
  localStorage.removeItem("bloodlink_push_on");
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

/** True when this browser already allowed notifications — never show the popup again. */
export function shouldSkipPushPrompt(): boolean {
  if (typeof window === "undefined") return true;
  if (hasAcceptedPushPrompt()) return true;
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    markPushPromptAccepted();
    return true;
  }
  return false;
}

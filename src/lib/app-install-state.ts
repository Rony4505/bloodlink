/**
 * Remembers that the visitor already has the BloodLink app, so the public
 * install bar stops asking. Set when:
 *  - the site runs inside the installed app on this device (the Play TWA shares
 *    Chrome's storage, so plain Chrome tabs on the same phone see it too), or
 *  - `/api/auth/me` reports the logged-in donor has opened the app (any device).
 */
const KEY = "bloodlink_app_installed";

const listeners = new Set<() => void>();

export function hasAppInstalled(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function markAppInstalled() {
  let changed = false;
  try {
    changed = localStorage.getItem(KEY) !== "1";
    localStorage.setItem(KEY, "1");
  } catch {
    /* ignore */
  }
  if (changed) listeners.forEach((cb) => cb());
}

export function subscribeAppInstalled(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Pull the server-side flag for the current donor session (no-op when logged out). */
export async function refreshAppInstalledFromServer(): Promise<void> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { appInstalled?: boolean };
    if (data.appInstalled) markAppInstalled();
  } catch {
    /* ignore */
  }
}

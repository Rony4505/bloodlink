type SessionListener = (loggedIn: boolean) => void;

let mePromise: Promise<boolean> | null = null;
const listeners = new Set<SessionListener>();

function notify(loggedIn: boolean) {
  listeners.forEach((fn) => {
    try {
      fn(loggedIn);
    } catch {
      /* ignore listener errors */
    }
  });
}

/** Re-run Header / Home logged-in UI when auth changes without a full reload. */
export function subscribeSessionMe(listener: SessionListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function invalidateSessionMe() {
  mePromise = null;
}

/** Call right after a successful donor login / register confirm. */
export function markDonorSessionActive() {
  mePromise = Promise.resolve(true);
  try {
    sessionStorage.removeItem("bloodlink_push_ask_skip");
  } catch {
    /* ignore */
  }
  notify(true);
}

/** Call right after donor logout. */
export function markDonorSessionInactive() {
  mePromise = Promise.resolve(false);
  notify(false);
}

/** Share /api/auth/me across Header + HomePage — never keep a stale false after login. */
export function loadLoggedIn(options?: { force?: boolean }): Promise<boolean> {
  if (options?.force) {
    mePromise = null;
  }
  if (!mePromise) {
    mePromise = fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const ok = Boolean(data.donor);
        notify(ok);
        return ok;
      })
      .catch(() => {
        mePromise = null;
        notify(false);
        return false;
      });
  }
  return mePromise;
}

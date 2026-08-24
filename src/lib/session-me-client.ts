let mePromise: Promise<boolean> | null = null;

/** Share a single /api/auth/me request across Header + HomePage. */
export function loadLoggedIn(): Promise<boolean> {
  if (!mePromise) {
    mePromise = fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => Boolean(data.donor))
      .catch(() => {
        mePromise = null;
        return false;
      });
  }
  return mePromise;
}

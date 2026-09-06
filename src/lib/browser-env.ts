/** Detect Facebook / Messenger / Instagram / TikTok / LinkedIn in-app browsers. */
export function isInAppBrowser(ua = typeof navigator !== "undefined" ? navigator.userAgent : ""): boolean {
  const u = ua || "";
  return /FBAN|FBAV|FB_IAB|Messenger|Instagram|Line\/|Twitter|TikTok|Bytedance|LinkedInApp|Snapchat|WhatsApp|MicroMessenger|Pinterest|Discord/i.test(
    u,
  );
}

/** True when this environment can actually store a deliverable Web Push subscription. */
export function canUseWebPushHere(): boolean {
  if (typeof window === "undefined") return false;
  if (isInAppBrowser()) return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Android Chrome intent URL to escape in-app browsers. */
export function chromeIntentUrl(httpsUrl: string): string | null {
  try {
    const u = new URL(httpsUrl);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    const hostPath = `${u.host}${u.pathname}${u.search}${u.hash}`;
    return `intent://${hostPath}#Intent;scheme=https;package=com.android.chrome;end`;
  } catch {
    return null;
  }
}

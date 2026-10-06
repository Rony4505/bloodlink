import { PLAY_STORE_PACKAGE } from "@/lib/site-cms";

/**
 * Referrer Chrome sets when our Play Store app (TWA) launches the site. Any
 * Android app that opens a link sets `android-app://<its package>` (Facebook,
 * Messenger, the Google app…), so only our own package counts as "the app".
 */
const PLAY_APP_REFERRER = `android-app://${PLAY_STORE_PACKAGE}`;

export function isLaunchedFromPlayApp(): boolean {
  if (typeof document === "undefined") return false;
  const ref = document.referrer;
  return ref === PLAY_APP_REFERRER || ref.startsWith(`${PLAY_APP_REFERRER}/`);
}

/** Running as an installed app window (TWA or PWA) rather than in a browser tab. */
export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  if (window.matchMedia("(display-mode: minimal-ui)").matches) return true;
  return Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

/** Already inside the installed BloodLink app — no point asking to install it. */
export function isInstalledApp(): boolean {
  return isLaunchedFromPlayApp() || isStandaloneDisplay();
}

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

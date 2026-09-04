function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = window.setTimeout(() => reject(new Error(`${label}-timeout`)), ms);
    promise.then(
      (value) => {
        window.clearTimeout(id);
        resolve(value);
      },
      (err) => {
        window.clearTimeout(id);
        reject(err);
      },
    );
  });
}

/** True for iPhone/iPad (including iPadOS desktop UA). Android must stay false. */
export function isLikelyIos() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  // Android devices can spoof quirks in in-app browsers — never treat as iOS.
  if (/Android/i.test(ua)) return false;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isStandalonePwa() {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches || Boolean(nav.standalone)
  );
}

/** Full Web Push (service worker + PushManager). */
export function isWebPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function canAskNotificationPermission() {
  return typeof window !== "undefined" && "Notification" in window;
}

export const LOCAL_PUSH_PERMISSION_PREFIX = "local-permission://";

export type EnableWebPushResult =
  | "granted"
  | "permission_only"
  | "denied"
  | "unsupported"
  | "error";

async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";

  const result = Notification.requestPermission();
  // Legacy callback-style API
  if (typeof result === "undefined") {
    return await new Promise((resolve) => {
      Notification.requestPermission((perm) => resolve(perm));
    });
  }
  return await result;
}

/** iPhone browser-tab only — cannot receive background Web Push. */
async function savePermissionOnly(): Promise<boolean> {
  try {
    const res = await withTimeout(
      fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ permissionOnly: true }),
      }),
      15_000,
      "perm-save",
    );
    return res.ok;
  } catch {
    return false;
  }
}

async function subscribeFullWebPushOnce(): Promise<boolean> {
  const reg = await withTimeout(
    (async () =>
      (await navigator.serviceWorker.getRegistration("/sw.js")) ||
      (await navigator.serviceWorker.register("/sw.js")))(),
    12_000,
    "sw-register",
  );
  await withTimeout(navigator.serviceWorker.ready, 12_000, "sw-ready");

  const keyRes = await withTimeout(
    fetch("/api/push/subscribe", { cache: "no-store", credentials: "same-origin" }),
    12_000,
    "vapid",
  );
  if (!keyRes.ok) return false;
  const { publicKey } = (await keyRes.json()) as { publicKey?: string | null };
  if (!publicKey) return false;

  // Reuse existing subscription when possible (faster / fewer browser prompts).
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await withTimeout(
      reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }),
      20_000,
      "subscribe",
    );
  }
  const json = sub.toJSON();
  const save = await withTimeout(
    fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: json.keys,
      }),
    }),
    15_000,
    "save-sub",
  );
  return save.ok;
}

async function subscribeFullWebPush(): Promise<boolean> {
  try {
    if (await subscribeFullWebPushOnce()) return true;
  } catch {
    /* retry once */
  }
  await new Promise((r) => setTimeout(r, 400));
  try {
    return await subscribeFullWebPushOnce();
  } catch {
    return false;
  }
}

/**
 * Allow-button handler.
 * - Android / desktop Chrome/Firefox: MUST save a real PushSubscription (deliverable).
 * - iPhone browser tab: permission-only marker (OS cannot deliver background push).
 * Never mark non-iOS as success with only a browser permission marker.
 */
export async function enableWebPush(options?: {
  /** True when the user explicitly tapped Allow — record intent if APIs are limited. */
  recordIntent?: boolean;
}): Promise<EnableWebPushResult> {
  if (typeof window === "undefined") return "unsupported";

  const recordIntent = options?.recordIntent === true;
  const iosBrowserTab = isLikelyIos() && !isStandalonePwa();
  const canFullPush =
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    !iosBrowserTab;

  try {
    let perm: NotificationPermission = "default";

    if ("Notification" in window) {
      if (Notification.permission === "denied") return "denied";
      try {
        perm = await withTimeout(requestNotificationPermission(), 12_000, "permission");
      } catch {
        perm = Notification.permission;
      }
      if (perm === "denied") return "denied";
    } else if (!recordIntent) {
      return "unsupported";
    }

    // Non-iPhone: require a real subscription. Do NOT fall back to permission-only.
    if (perm === "granted" && canFullPush) {
      if (await subscribeFullWebPush()) {
        localStorage.setItem("bloodlink_push_on", "1");
        return "granted";
      }
      return "error";
    }

    // iPhone browser tab only — save permission marker so admin can see they allowed.
    if (iosBrowserTab && (perm === "granted" || recordIntent)) {
      if (await savePermissionOnly()) {
        return "permission_only";
      }
      return "error";
    }

    // iPhone as installed PWA with PushManager should have taken canFullPush path.
    if (perm === "granted" && isLikelyIos() && isStandalonePwa()) {
      if (canFullPush && (await subscribeFullWebPush())) {
        localStorage.setItem("bloodlink_push_on", "1");
        return "granted";
      }
      if (await savePermissionOnly()) return "permission_only";
      return "error";
    }

    return perm === "granted" ? "error" : "denied";
  } catch {
    return "error";
  }
}

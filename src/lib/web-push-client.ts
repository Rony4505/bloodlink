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

function isLikelyIos() {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
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

async function savePermissionOnly(): Promise<boolean> {
  try {
    const res = await withTimeout(
      fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ permissionOnly: true }),
      }),
      12_000,
      "perm-save",
    );
    return res.ok;
  } catch {
    return false;
  }
}

async function subscribeFullWebPush(): Promise<boolean> {
  const reg = await withTimeout(
    (async () =>
      (await navigator.serviceWorker.getRegistration("/sw.js")) ||
      (await navigator.serviceWorker.register("/sw.js")))(),
    5_000,
    "sw-register",
  );
  await withTimeout(navigator.serviceWorker.ready, 5_000, "sw-ready");

  const keyRes = await withTimeout(
    fetch("/api/push/subscribe", { cache: "no-store", credentials: "same-origin" }),
    10_000,
    "vapid",
  );
  if (!keyRes.ok) return false;
  const { publicKey } = (await keyRes.json()) as { publicKey?: string | null };
  if (!publicKey) return false;

  const sub = await withTimeout(
    reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }),
    10_000,
    "subscribe",
  );
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
    12_000,
    "save-sub",
  );
  return save.ok;
}

/**
 * Allow-button handler. Never hangs: SW/permission steps are time-boxed.
 * On iPhone browser tabs (no real PushManager flow), saves a permission marker
 * after the user taps Allow so the action always completes.
 */
export async function enableWebPush(options?: {
  /** True when the user explicitly tapped Allow — record intent if APIs are limited. */
  recordIntent?: boolean;
}): Promise<"granted" | "denied" | "unsupported" | "error"> {
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
        perm = await withTimeout(requestNotificationPermission(), 8_000, "permission");
      } catch {
        perm = Notification.permission;
      }
      if (perm === "denied") return "denied";
    } else if (!recordIntent) {
      return "unsupported";
    }

    if (perm === "granted" && canFullPush) {
      try {
        if (await subscribeFullWebPush()) {
          localStorage.setItem("bloodlink_push_on", "1");
          return "granted";
        }
      } catch {
        /* fall through to permission-only */
      }
    }

    // Permission granted in browser tab only — do NOT mark as fully enabled.
    if (perm === "granted" || recordIntent) {
      if (iosBrowserTab) {
        if (await savePermissionOnly()) {
          return "granted";
        }
        return "error";
      }
      if (await savePermissionOnly()) {
        localStorage.setItem("bloodlink_push_on", "1");
        return "granted";
      }
      return "error";
    }

    return "denied";
  } catch {
    if (recordIntent && !iosBrowserTab && (await savePermissionOnly())) {
      localStorage.setItem("bloodlink_push_on", "1");
      return "granted";
    }
    return "error";
  }
}

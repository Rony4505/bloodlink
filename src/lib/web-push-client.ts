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

export type EnableWebPushResult =
  | "granted"
  | "permission_only"
  | "denied"
  | "unsupported"
  | "error";

export type EnableWebPushOptions = {
  /** Donor default: /api/push/subscribe. Admin/volunteer pass their own URLs. */
  statusUrl?: string;
  saveUrl?: string;
  /** When true, force unsubscribe + fresh subscribe (push rebuild). */
  forceRefresh?: boolean;
  /** Allow iOS tab permission-only marker (donors only). */
  allowPermissionOnly?: boolean;
  recordIntent?: boolean;
};

async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  const result = Notification.requestPermission();
  if (typeof result === "undefined") {
    return await new Promise((resolve) => {
      Notification.requestPermission((perm) => resolve(perm));
    });
  }
  return await result;
}

async function savePermissionOnly(saveUrl: string): Promise<boolean> {
  try {
    const res = await withTimeout(
      fetch(saveUrl, {
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

async function confirmDeliverable(statusUrl: string): Promise<boolean> {
  try {
    const res = await withTimeout(
      fetch(statusUrl, { cache: "no-store", credentials: "same-origin" }),
      12_000,
      "status",
    );
    if (!res.ok) return false;
    const data = (await res.json()) as { subscribed?: boolean };
    return Boolean(data.subscribed);
  } catch {
    return false;
  }
}

async function subscribeFullWebPushOnce(options: {
  statusUrl: string;
  saveUrl: string;
  forceRefresh: boolean;
}): Promise<boolean> {
  const reg = await withTimeout(
    (async () =>
      (await navigator.serviceWorker.getRegistration("/sw.js")) ||
      (await navigator.serviceWorker.register("/sw.js")))(),
    12_000,
    "sw-register",
  );
  await withTimeout(navigator.serviceWorker.ready, 12_000, "sw-ready");

  const keyRes = await withTimeout(
    fetch(options.statusUrl, { cache: "no-store", credentials: "same-origin" }),
    12_000,
    "vapid",
  );
  if (!keyRes.ok) return false;
  const { publicKey } = (await keyRes.json()) as { publicKey?: string | null };
  if (!publicKey) return false;

  let sub = await reg.pushManager.getSubscription();
  if (sub && options.forceRefresh) {
    try {
      await sub.unsubscribe();
    } catch {
      /* continue */
    }
    sub = null;
  }
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
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;

  const save = await withTimeout(
    fetch(options.saveUrl, {
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
  if (!save.ok) return false;

  // Confirm server row is deliverable for this role.
  return confirmDeliverable(options.statusUrl);
}

async function subscribeFullWebPush(options: {
  statusUrl: string;
  saveUrl: string;
  forceRefresh: boolean;
}): Promise<boolean> {
  try {
    if (await subscribeFullWebPushOnce(options)) return true;
  } catch {
    /* retry */
  }
  await new Promise((r) => setTimeout(r, 400));
  try {
    return await subscribeFullWebPushOnce({ ...options, forceRefresh: true });
  } catch {
    return false;
  }
}

/**
 * Unified Allow handler for donor / admin / volunteer.
 * Always requires a deliverable server subscription on Android/desktop.
 */
export async function enableWebPush(
  options: EnableWebPushOptions = {},
): Promise<EnableWebPushResult> {
  if (typeof window === "undefined") return "unsupported";

  const statusUrl = options.statusUrl || "/api/push/subscribe";
  const saveUrl = options.saveUrl || "/api/push/subscribe";
  const forceRefresh = options.forceRefresh !== false; // default true after rebuild
  const allowPermissionOnly = options.allowPermissionOnly === true;
  const recordIntent = options.recordIntent === true;
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

    if (perm === "granted" && canFullPush) {
      if (
        await subscribeFullWebPush({
          statusUrl,
          saveUrl,
          forceRefresh,
        })
      ) {
        return "granted";
      }
      return "error";
    }

    // iPhone browser tab — donors only may save permission-only markers.
    if (allowPermissionOnly && iosBrowserTab && (perm === "granted" || recordIntent)) {
      if (await savePermissionOnly(saveUrl)) return "permission_only";
      return "error";
    }

    if (perm === "granted" && isLikelyIos() && isStandalonePwa()) {
      if (
        await subscribeFullWebPush({
          statusUrl,
          saveUrl,
          forceRefresh,
        })
      ) {
        return "granted";
      }
      if (allowPermissionOnly && (await savePermissionOnly(saveUrl))) {
        return "permission_only";
      }
      return "error";
    }

    return perm === "granted" ? "error" : "denied";
  } catch {
    return "error";
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export function isWebPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Request permission, register SW, and save push subscription for the logged-in donor. */
export async function enableWebPush(): Promise<"granted" | "denied" | "unsupported" | "error"> {
  if (!isWebPushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";

  try {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return "denied";

    const reg =
      (await navigator.serviceWorker.getRegistration("/sw.js")) ||
      (await navigator.serviceWorker.register("/sw.js"));
    await navigator.serviceWorker.ready;

    const keyRes = await fetch("/api/push/subscribe");
    if (!keyRes.ok) return "error";
    const { publicKey } = (await keyRes.json()) as { publicKey: string };

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    const json = sub.toJSON();
    const save = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: json.keys,
      }),
    });
    if (!save.ok) return "error";
    localStorage.setItem("bloodlink_push_on", "1");
    return "granted";
  } catch {
    return "error";
  }
}

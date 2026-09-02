"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  canAskNotificationPermission,
  enableWebPush,
  isWebPushSupported,
} from "@/lib/web-push-client";

async function fetchAdminPushStatus(): Promise<boolean> {
  try {
    const res = await fetch("/api/admin/push/subscribe", { cache: "no-store" });
    if (!res.ok) return false;
    const data = (await res.json()) as { subscribed?: boolean };
    return Boolean(data.subscribed);
  } catch {
    return false;
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

async function subscribeAdminPush(): Promise<boolean> {
  if (!isWebPushSupported()) return false;
  if (!("Notification" in window)) return false;
  if (Notification.permission === "denied") return false;

  let perm: NotificationPermission = Notification.permission;
  if (perm === "default") {
    perm = await Notification.requestPermission();
  }
  if (perm !== "granted") return false;

  const reg =
    (await navigator.serviceWorker.getRegistration("/sw.js")) ||
    (await navigator.serviceWorker.register("/sw.js"));
  await navigator.serviceWorker.ready;

  const keyRes = await fetch("/api/admin/push/subscribe", { cache: "no-store" });
  if (!keyRes.ok) return false;
  const { publicKey } = (await keyRes.json()) as { publicKey?: string | null };
  if (!publicKey) return false;

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
  const json = sub.toJSON();
  const save = await fetch("/api/admin/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys,
    }),
  });
  return save.ok;
}

/** One-time admin push enable card inside the owner console. */
export function AdminPushEnableGate() {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!canAskNotificationPermission()) return;
      const subscribed = await fetchAdminPushStatus();
      if (cancelled) return;
      if (subscribed) {
        setDone(true);
        return;
      }
      if (Notification.permission === "denied") return;
      const snoozed = localStorage.getItem("bloodlink_admin_push_snooze");
      if (snoozed && Date.now() < Date.parse(snoozed)) return;
      setVisible(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!visible || done) return null;

  return (
    <div className="rounded-2xl border border-[color-mix(in_oklab,var(--blood)_22%,transparent)] bg-[linear-gradient(160deg,#fff4f1,#ffffff)] px-4 py-4 shadow-sm">
      <p className="text-sm font-semibold text-[var(--blood-deep)]">{t.adminPushTitle}</p>
      <p className="mt-1 text-xs leading-relaxed text-[color-mix(in_oklab,var(--ink)_65%,white)]">
        {t.adminPushBody}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          className="btn-primary"
          onClick={() => {
            setBusy(true);
            void (async () => {
              try {
                const ok = isWebPushSupported()
                  ? await subscribeAdminPush()
                  : false;
                if (ok) {
                  setDone(true);
                  setVisible(false);
                  return;
                }
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          {busy ? t.loading : t.adminPushAllow}
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            localStorage.setItem(
              "bloodlink_admin_push_snooze",
              new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            );
            setVisible(false);
          }}
        >
          {t.registerPushSkip}
        </button>
      </div>
    </div>
  );
}

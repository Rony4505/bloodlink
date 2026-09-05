"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  canAskNotificationPermission,
  isWebPushSupported,
} from "@/lib/web-push-client";

const ADMIN_PUSH_DISMISS_KEY = "bloodlink_admin_push_dismissed";
const ADMIN_PUSH_SESSION_KEY = "bloodlink_admin_push_asked_session";
const ADMIN_PUSH_SNOOZE_KEY = "bloodlink_admin_push_snooze";

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

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }
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

function dismissForever() {
  localStorage.setItem(ADMIN_PUSH_DISMISS_KEY, "1");
  localStorage.removeItem(ADMIN_PUSH_SNOOZE_KEY);
}

/** One-time admin push enable card inside the owner console. */
export function AdminPushEnableGate() {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!canAskNotificationPermission()) return;
      if (localStorage.getItem(ADMIN_PUSH_DISMISS_KEY) === "1") return;
      if (sessionStorage.getItem(ADMIN_PUSH_SESSION_KEY) === "1") return;

      const subscribed = await fetchAdminPushStatus();
      if (cancelled) return;
      if (subscribed) {
        setDone(true);
        dismissForever();
        return;
      }

      // Already allowed — never show the prompt again; try silent subscribe.
      if (Notification.permission === "granted") {
        if (isWebPushSupported()) {
          const ok = await subscribeAdminPush();
          if (cancelled) return;
          if (ok) {
            setDone(true);
            dismissForever();
            return;
          }
        }
        // Permission granted counts as Allow — stop asking even if subscribe fails.
        dismissForever();
        return;
      }

      if (Notification.permission === "denied") {
        dismissForever();
        return;
      }

      const snoozed = localStorage.getItem(ADMIN_PUSH_SNOOZE_KEY);
      if (snoozed && Date.now() < Date.parse(snoozed)) return;

      sessionStorage.setItem(ADMIN_PUSH_SESSION_KEY, "1");
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
      {error ? (
        <p className="mt-2 text-xs font-medium text-[var(--blood)]">{error}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          className="btn-primary"
          onClick={() => {
            setBusy(true);
            setError("");
            void (async () => {
              try {
                const ok = isWebPushSupported()
                  ? await subscribeAdminPush()
                  : false;
                if (ok) {
                  dismissForever();
                  setDone(true);
                  setVisible(false);
                  return;
                }
                setError(t.pushEnableError);
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
            // Permanent dismiss — do not keep asking on every admin visit
            dismissForever();
            setVisible(false);
          }}
        >
          {t.registerPushSkip}
        </button>
      </div>
    </div>
  );
}

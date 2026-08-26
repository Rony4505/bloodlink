"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

/** Registers SW + push subscription so alerts work with the site closed (internet on). */
export function PushEnableBanner({ enabled }: { enabled: boolean }) {
  const { t, locale } = useLocale();
  const [status, setStatus] = useState<"idle" | "on" | "denied" | "unsupported">(
    "idle",
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    void navigator.serviceWorker.getRegistration("/sw.js").then((reg) => {
      if (reg?.active && Notification.permission === "granted") setStatus("on");
    });
  }, [enabled]);

  async function enable() {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setStatus("denied");
        return;
      }

      const reg =
        (await navigator.serviceWorker.getRegistration("/sw.js")) ||
        (await navigator.serviceWorker.register("/sw.js"));
      await navigator.serviceWorker.ready;

      const keyRes = await fetch("/api/push/subscribe");
      if (!keyRes.ok) throw new Error("vapid");
      const { publicKey } = await keyRes.json();

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
      if (!save.ok) throw new Error("save");
      setStatus("on");
      localStorage.setItem("bloodlink_push_on", "1");
    } catch {
      setStatus("idle");
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;
  if (status === "on" || status === "unsupported") return null;

  return (
    <div className="mb-4 rounded-2xl border border-[color-mix(in_oklab,var(--blood)_22%,transparent)] bg-[linear-gradient(160deg,#fff4f1,#ffffff)] px-4 py-3 shadow-sm">
      <p className="text-sm font-semibold text-[var(--blood-deep)]">
        {locale === "bn" ? t.pushEnableTitle : t.pushEnableTitle}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-[color-mix(in_oklab,var(--ink)_65%,white)]">
        {t.pushEnableBody}
      </p>
      {status === "denied" ? (
        <p className="mt-2 text-xs font-medium text-[var(--blood)]">{t.pushDenied}</p>
      ) : (
        <button
          type="button"
          className="btn-primary mt-3"
          disabled={busy}
          onClick={() => void enable()}
        >
          {busy ? t.loading : t.pushEnableButton}
        </button>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  clearPushPromptAccepted,
  markPushPromptAccepted,
  shouldSkipPushPrompt,
} from "@/lib/push-prompt-state";

type GateStatus = "loading" | "ask" | "on" | "denied" | "error";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

type Props = {
  token: string;
  publicKey: string | null;
  notificationsEnabled: boolean;
  onSubscribed?: () => void;
};

export function VolunteerPushEnableGate({
  token,
  publicKey,
  notificationsEnabled,
  onSubscribed,
}: Props) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<GateStatus>("loading");
  const [inlineOn, setInlineOn] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!notificationsEnabled || !publicKey) {
      setStatus("error");
      return;
    }

    try {
      const res = await fetch(
        `/api/public/volunteer/${encodeURIComponent(token)}/push`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const data = (await res.json()) as { subscribed?: boolean };
        if (data.subscribed) {
          markPushPromptAccepted();
          setStatus("on");
          setInlineOn(true);
          setOpen(false);
          return;
        }
      }

      // Browser already granted but server not subscribed yet — finish subscribe
      // so admin can see this volunteer as Allow.
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        setStatus("loading");
        try {
          const reg = await navigator.serviceWorker.register("/sw.js");
          await navigator.serviceWorker.ready;
          let sub = await reg.pushManager.getSubscription();
          if (!sub) {
            sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(publicKey),
            });
          }
          const save = await fetch(
            `/api/public/volunteer/${encodeURIComponent(token)}/push`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(sub.toJSON()),
            },
          );
          if (save.ok) {
            markPushPromptAccepted();
            setStatus("on");
            setInlineOn(true);
            setOpen(false);
            onSubscribed?.();
            return;
          }
        } catch {
          /* fall through to ask */
        }
      }

      if (shouldSkipPushPrompt()) {
        // Local accept without server row — ask again so Allow can sync.
        clearPushPromptAccepted();
      }

      setStatus("ask");
      setOpen(true);
    } catch {
      setStatus("ask");
      setOpen(true);
    }
  }, [notificationsEnabled, publicKey, token, onSubscribed]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void checkStatus();
    }, 400);
    return () => window.clearTimeout(id);
  }, [checkStatus]);

  async function onAllow() {
    if (!publicKey) return;
    setBusy(true);
    setStatus("loading");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setStatus("denied");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }
      const res = await fetch(
        `/api/public/volunteer/${encodeURIComponent(token)}/push`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub.toJSON()),
        },
      );
      if (!res.ok) {
        setStatus("error");
        return;
      }
      markPushPromptAccepted();
      setStatus("on");
      setInlineOn(true);
      onSubscribed?.();
      window.setTimeout(() => setOpen(false), 1200);
    } catch {
      setStatus("error");
    } finally {
      setBusy(false);
    }
  }

  const bodyText =
    status === "on" || inlineOn
      ? t.volunteerPushActiveNow
      : status === "denied"
        ? t.volunteerPushDenied
        : status === "error"
          ? t.volunteerPushUnavailable
          : t.volunteerNotificationsHint;

  if (!notificationsEnabled || !publicKey) return null;

  return (
    <>
      <section className="rounded-2xl border border-[var(--line)] bg-white/90 p-5 shadow-sm">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
          {t.volunteerNotificationsTitle}
        </h2>
        <p
          className={`mt-2 text-sm ${
            inlineOn || status === "on"
              ? "font-semibold text-[var(--sage)]"
              : "text-[color-mix(in_oklab,var(--ink)_58%,white)]"
          }`}
        >
          {bodyText}
        </p>
        {!inlineOn && status !== "on" && status !== "denied" ? (
          <button
            type="button"
            className="btn-primary mt-3"
            disabled={busy}
            onClick={() => void onAllow()}
          >
            {busy ? t.loading : t.volunteerEnablePush}
          </button>
        ) : null}
      </section>

      {open && status !== "on" && !inlineOn ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-4 backdrop-blur-[2px] sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-[28px] border border-[var(--line)] bg-white p-6 shadow-2xl"
          >
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--blood-deep)]">
              {t.volunteerNotificationsTitle}
            </h2>
            <p className="mt-2 text-sm text-[color-mix(in_oklab,var(--ink)_72%,white)]">
              {bodyText}
            </p>
            {status === "ask" || status === "loading" || status === "error" ? (
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onAllow()}
                  className="btn-primary flex-1"
                >
                  {busy ? t.loading : t.volunteerEnablePush}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setOpen(false)}
                  className="btn-ghost flex-1"
                >
                  {t.registerPushSkip}
                </button>
              </div>
            ) : status === "denied" ? (
              <button type="button" className="btn-ghost mt-5 w-full" onClick={() => setOpen(false)}>
                {t.close}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

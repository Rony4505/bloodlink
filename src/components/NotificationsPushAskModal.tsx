"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import { enableWebPush, isWebPushSupported } from "@/lib/web-push-client";

/** Full-screen prompt when an existing donor opens Notifications without push enabled. */
export function NotificationsPushAskModal() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"ask" | "on" | "denied">("ask");

  useEffect(() => {
    if (!isWebPushSupported()) return;
    if (Notification.permission === "denied") return;
    if (Notification.permission === "granted") {
      const already = localStorage.getItem("bloodlink_push_on") === "1";
      if (already) return;
      void enableWebPush().then((result) => {
        if (result === "granted") localStorage.setItem("bloodlink_push_on", "1");
      });
      return;
    }
    if (localStorage.getItem("bloodlink_push_on") === "1") return;
    setOpen(true);
  }, []);

  async function onAllow() {
    setBusy(true);
    const result = await enableWebPush();
    setBusy(false);
    if (result === "granted") {
      setStatus("on");
      window.setTimeout(() => setOpen(false), 900);
      return;
    }
    if (result === "denied") {
      setStatus("denied");
      return;
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/55 p-4 backdrop-blur-[2px] sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="push-ask-title"
        className="animate-[rise_0.35s_ease-out] w-full max-w-md rounded-[28px] border border-[var(--line)] bg-[linear-gradient(165deg,#fff8f4_0%,var(--mist)_45%,#f3ebe4_100%)] p-6 shadow-2xl sm:p-7"
      >
        <h2
          id="push-ask-title"
          className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[var(--blood-deep)]"
        >
          {t.registerPushTitle}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[color-mix(in_oklab,var(--ink)_72%,white)]">
          {t.registerPushBody}
        </p>

        {status === "on" ? (
          <p className="mt-4 text-sm font-medium text-[var(--sage)]">{t.registerPushOn}</p>
        ) : null}
        {status === "denied" ? (
          <p className="mt-4 text-sm font-medium text-[var(--blood)]">{t.pushDenied}</p>
        ) : null}

        {status === "ask" ? (
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={busy}
              onClick={() => void onAllow()}
              className="inline-flex flex-1 items-center justify-center rounded-full bg-[var(--blood)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--blood-deep)] disabled:opacity-60"
            >
              {busy ? t.loading : t.registerPushAllow}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setOpen(false)}
              className="inline-flex flex-1 items-center justify-center rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--mist)] disabled:opacity-60"
            >
              {t.registerPushSkip}
            </button>
          </div>
        ) : status === "denied" ? (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-5 inline-flex w-full items-center justify-center rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--ink)]"
          >
            {t.close}
          </button>
        ) : null}
      </div>
    </div>
  );
}

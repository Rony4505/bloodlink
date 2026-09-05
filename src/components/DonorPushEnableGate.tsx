"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  clearPushPromptSnooze,
  markPushPromptAccepted,
  markPushPromptShownThisSession,
  shouldSkipPushPrompt,
  snoozePushPrompt,
  wasPushPromptShownThisSession,
} from "@/lib/push-prompt-state";
import { enableWebPush, isLikelyIos } from "@/lib/web-push-client";
import { loadLoggedIn } from "@/lib/session-me-client";

type Props = {
  requireLogin?: boolean;
};

type PushStatus = {
  subscribed: boolean;
  permissionOnly: boolean;
};

async function fetchPushStatus(): Promise<PushStatus> {
  try {
    const res = await fetch("/api/push/subscribe", { cache: "no-store" });
    if (res.status === 401 || !res.ok) {
      return { subscribed: false, permissionOnly: false };
    }
    const data = (await res.json()) as {
      subscribed?: boolean;
      permissionOnly?: boolean;
    };
    return {
      subscribed: Boolean(data.subscribed),
      permissionOnly: Boolean(data.permissionOnly),
    };
  } catch {
    return { subscribed: false, permissionOnly: false };
  }
}

/**
 * Notification Allow popup for logged-in donors.
 * Asks until the user allows notifications; once allowed, never shows again on this browser.
 * - Real push (Android/desktop) → stop asking
 * - iPhone browser permission-only → stop asking (OS limit)
 * - Not now → hide this session only; next login asks again
 */
export function DonorPushEnableGate({ requireLogin = true }: Props) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [failHint, setFailHint] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      await new Promise((r) => setTimeout(r, 200));
      if (cancelled) return;

      // Drop old 30-day snoozes so past "Not now" users get asked again.
      clearPushPromptSnooze();

      // Once per browser session (each new login = new session → ask again).
      if (wasPushPromptShownThisSession()) return;

      if (requireLogin) {
        let ok = await loadLoggedIn({ force: true });
        if (!ok) {
          await new Promise((r) => setTimeout(r, 350));
          ok = await loadLoggedIn({ force: true });
        }
        if (!ok || cancelled) return;
      }

      const status = await fetchPushStatus();
      if (cancelled) return;

      // Real deliverable push — done forever on this device.
      if (status.subscribed) {
        markPushPromptAccepted();
        return;
      }

      // iPhone browser-only is the best we can do (already saved on server).
      if (status.permissionOnly && isLikelyIos()) {
        markPushPromptAccepted();
        return;
      }

      // Non-iPhone with stale permission-only: try silent upgrade first.
      if (status.permissionOnly && !isLikelyIos()) {
        const upgraded = await enableWebPush({ recordIntent: true });
        if (cancelled) return;
        if (upgraded === "granted") {
          markPushPromptAccepted();
          return;
        }
      }

      if (cancelled) return;
      // Browser hard-blocked notifications — short pause only.
      if (typeof Notification !== "undefined" && Notification.permission === "denied") {
        snoozePushPrompt(1);
        return;
      }

      // Browser already granted, but server has no row yet — sync so admin sees Allow.
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        const synced = await enableWebPush({ recordIntent: true });
        if (cancelled) return;
        if (synced === "granted" || synced === "permission_only") {
          markPushPromptAccepted();
          return;
        }
        // Fall through and show popup so they can retry Allow.
      }

      // Local "accepted" alone is not enough — only skip after server sync above.
      if (shouldSkipPushPrompt() && (status.subscribed || status.permissionOnly)) {
        return;
      }

      markPushPromptShownThisSession();
      setOpen(true);
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [requireLogin]);

  function onSkip() {
    // This session only — next login will ask again until Allow.
    setOpen(false);
  }

  async function onAllow() {
    setBusy(true);
    setFailHint("");
    try {
      const result = await enableWebPush({ recordIntent: true });
      if (result === "granted" || result === "permission_only") {
        markPushPromptAccepted();
        setDone(true);
        window.setTimeout(() => setOpen(false), 800);
        return;
      }
      if (result === "denied") {
        setFailHint(t.pushDenied);
        snoozePushPrompt(1);
        setOpen(false);
        return;
      }
      setFailHint(t.pushEnableError);
      // Stay open so they can tap Allow again this session.
    } catch {
      setFailHint(t.pushEnableError);
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-4 backdrop-blur-[2px] sm:items-center">
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
        {failHint ? (
          <p className="mt-2 text-sm font-medium text-[var(--blood)]">{failHint}</p>
        ) : null}

        {done ? (
          <p className="mt-4 text-sm font-medium text-[var(--sage)]">{t.registerPushOn}</p>
        ) : (
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
              onClick={onSkip}
              className="inline-flex flex-1 items-center justify-center rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--mist)] disabled:opacity-60"
            >
              {t.registerPushSkip}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** @deprecated use DonorPushEnableGate */
export function NotificationsPushAskModal() {
  return <DonorPushEnableGate requireLogin />;
}

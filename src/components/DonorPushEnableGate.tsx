"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  hasAcceptedPushPrompt,
  isPushPromptSnoozed,
  markPushPromptAccepted,
  markPushPromptShownThisSession,
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
 * Simple notification Allow popup for logged-in donors.
 * - Full push (Android/desktop) → never ask again
 * - iPhone browser-only → accept (OS limit)
 * - Not now → again after 30 days
 * - Non-iPhone stuck on "browser only" → ask again / upgrade to real push
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

      if (isPushPromptSnoozed()) return;
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

      // iPhone browser-only is the best we can do.
      if (status.permissionOnly && isLikelyIos()) {
        markPushPromptAccepted();
        return;
      }

      // Non-iPhone with permission-only marker: try silent upgrade once.
      if (status.permissionOnly && !isLikelyIos()) {
        const upgraded = await enableWebPush({ recordIntent: true });
        if (cancelled) return;
        if (upgraded === "granted") {
          markPushPromptAccepted();
          return;
        }
        // Still broken — show Allow again (don't treat as accepted).
        if (hasAcceptedPushPrompt()) {
          // Clear false "accepted" from older buggy clients so we can re-ask.
          try {
            localStorage.removeItem("bloodlink_push_accepted");
            localStorage.removeItem("bloodlink_push_on");
          } catch {
            /* ignore */
          }
        }
      } else if (hasAcceptedPushPrompt()) {
        return;
      }

      if (cancelled) return;
      markPushPromptShownThisSession();
      setOpen(true);
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [requireLogin]);

  function onSkip() {
    snoozePushPrompt(30);
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
        snoozePushPrompt(30);
        setOpen(false);
        return;
      }
      // Subscribe failed (common on slow Android) — short snooze, show hint
      setFailHint(t.pushEnableError);
      snoozePushPrompt(1);
    } catch {
      setFailHint(t.pushEnableError);
      snoozePushPrompt(1);
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

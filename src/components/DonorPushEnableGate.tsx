"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  clearPushPromptSnooze,
  markPushPromptAccepted,
  migratePushPromptStorage,
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
 * Blocks until the donor allows notifications (or iOS permission-only is saved).
 * Never silently skips — even if the browser previously denied.
 * Locked-phone delivery needs a real Allow + data connection (Android Chrome / iOS Home Screen).
 */
export function DonorPushEnableGate({ requireLogin = true }: Props) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [failHint, setFailHint] = useState("");
  const [hardDenied, setHardDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      await new Promise((r) => setTimeout(r, 150));
      if (cancelled) return;

      migratePushPromptStorage();
      // Never stay snoozed — keep asking until Allow succeeds.
      clearPushPromptSnooze();

      if (requireLogin) {
        let ok = await loadLoggedIn({ force: true });
        if (!ok) {
          await new Promise((r) => setTimeout(r, 400));
          ok = await loadLoggedIn({ force: true });
        }
        if (!ok || cancelled) return;
      }

      const status = await fetchPushStatus();
      if (cancelled) return;

      // Real deliverable Web Push — stop asking.
      if (status.subscribed) {
        markPushPromptAccepted();
        return;
      }

      // iPhone browser tab: permission-only is the best OS allows without Home Screen.
      if (status.permissionOnly && isLikelyIos()) {
        markPushPromptAccepted();
        return;
      }

      // Browser already granted — sync subscription silently, then stop if OK.
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        const synced = await enableWebPush({
          recordIntent: true,
          forceRefresh: true,
          allowPermissionOnly: isLikelyIos(),
        });
        if (cancelled) return;
        if (synced === "granted" || (synced === "permission_only" && isLikelyIos())) {
          markPushPromptAccepted();
          return;
        }
      }

      if (cancelled) return;

      // Hard deny: still SHOW the popup with unblock instructions (never silent skip).
      if (typeof Notification !== "undefined" && Notification.permission === "denied") {
        setHardDenied(true);
        setFailHint(t.pushDeniedHint);
      }

      setOpen(true);
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [requireLogin, t.pushDeniedHint]);

  async function onAllow() {
    setBusy(true);
    setFailHint("");
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "denied") {
        setHardDenied(true);
        setFailHint(t.pushDeniedHint);
        return;
      }

      const result = await enableWebPush({
        recordIntent: true,
        forceRefresh: true,
        allowPermissionOnly: isLikelyIos(),
      });
      if (result === "granted" || result === "permission_only") {
        markPushPromptAccepted();
        setDone(true);
        setHardDenied(false);
        window.setTimeout(() => setOpen(false), 700);
        return;
      }
      if (result === "denied") {
        setHardDenied(true);
        setFailHint(t.pushDeniedHint);
        return;
      }
      setFailHint(t.pushEnableError);
    } catch {
      setFailHint(t.pushEnableError);
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-4 backdrop-blur-[2px] sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="push-ask-title"
        className="animate-[rise_0.35s_ease-out] w-full max-w-md rounded-[28px] border border-[var(--line)] bg-[linear-gradient(165deg,#fff8f4_0%,var(--mist)_45%,#f3ebe4_100%)] p-6 shadow-2xl sm:p-7"
        onMouseDown={(e) => e.stopPropagation()}
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
        <p className="mt-2 text-xs font-medium text-[var(--blood)]">
          {t.registerPushRequired}
        </p>
        {hardDenied || failHint ? (
          <p className="mt-3 rounded-xl bg-[color-mix(in_oklab,var(--blood)_10%,white)] px-3 py-2 text-sm font-medium text-[var(--blood)]">
            {failHint || t.pushDeniedHint}
          </p>
        ) : null}

        {done ? (
          <p className="mt-4 text-sm font-medium text-[var(--sage)]">{t.registerPushOn}</p>
        ) : (
          <div className="mt-5">
            <button
              type="button"
              disabled={busy}
              onClick={() => void onAllow()}
              className="inline-flex w-full items-center justify-center rounded-full bg-[var(--blood)] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--blood-deep)] disabled:opacity-60"
            >
              {busy ? t.loading : t.registerPushAllow}
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

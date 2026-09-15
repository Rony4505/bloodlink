"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  markPushPromptAccepted,
  markPushPromptShownThisSession,
  migratePushPromptStorage,
  shouldShowSoftPushAsk,
  snoozePushPrompt,
  wasPushPromptShownThisSession,
} from "@/lib/push-prompt-state";
import { enableWebPush, isLikelyIos } from "@/lib/web-push-client";

const SKIP_PATH_PREFIXES = [
  "/admin",
  "/volunteer/login",
  "/work/",
];

function shouldSkipPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return SKIP_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p),
  );
}

/**
 * Soft site-wide push ask: small Allow / Deny popup.
 * - Allow → subscribe (when possible) and never ask again on this browser
 * - Deny → hide for 3 days, then ask again
 * Never blocks the site and never reload-loops.
 */
export function SoftSitePushAsk() {
  const { t } = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (shouldSkipPath(pathname)) {
      setOpen(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      migratePushPromptStorage();
      if (!shouldShowSoftPushAsk()) return;
      // One soft ask per browser session — Deny still snoozes 3 days across sessions.
      if (wasPushPromptShownThisSession()) return;
      markPushPromptShownThisSession();
      setOpen(true);
    }, 900);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pathname]);

  async function onAllow() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await enableWebPush({
        recordIntent: true,
        forceRefresh: true,
        allowPermissionOnly: isLikelyIos(),
      });
      const browserGranted =
        typeof Notification !== "undefined" &&
        Notification.permission === "granted";

      if (
        result === "granted" ||
        result === "permission_only" ||
        browserGranted
      ) {
        markPushPromptAccepted();
        setOpen(false);
        return;
      }

      // Browser Deny / failure → treat like soft Deny (ask again in 3 days).
      snoozePushPrompt(3);
      setOpen(false);
    } catch {
      snoozePushPrompt(3);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  function onDeny() {
    if (busy) return;
    snoozePushPrompt(3);
    setOpen(false);
  }

  if (!open || shouldSkipPath(pathname)) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-center p-4 sm:bottom-6"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby="soft-push-ask-title"
        className="pointer-events-auto w-full max-w-sm animate-[rise_0.3s_ease-out] rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[0_12px_40px_rgba(28,10,12,0.28)]"
      >
        <p
          id="soft-push-ask-title"
          className="text-center text-sm font-semibold leading-snug text-[var(--blood-deep)] sm:text-base"
        >
          {t.softPushAsk}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onDeny}
            className="inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-white px-3 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--mist)] disabled:opacity-60"
          >
            {t.softPushDeny}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onAllow()}
            className="inline-flex items-center justify-center rounded-full bg-[var(--blood)] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--blood-deep)] disabled:opacity-60"
          >
            {busy ? t.loading : t.softPushAllow}
          </button>
        </div>
      </div>
    </div>
  );
}

/** @deprecated use SoftSitePushAsk */
export function DonorPushEnableGate(_props?: { requireLogin?: boolean }) {
  return <SoftSitePushAsk />;
}

/** @deprecated use SoftSitePushAsk */
export function NotificationsPushAskModal() {
  return <SoftSitePushAsk />;
}

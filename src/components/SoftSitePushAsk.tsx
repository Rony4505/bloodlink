"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  clearPushPromptAccepted,
  markPushPromptAccepted,
  markPushPromptShownThisSession,
  migratePushPromptStorage,
  shouldShowSoftPushAsk,
  snoozePushPrompt,
  wasPushPromptShownThisSession,
} from "@/lib/push-prompt-state";
import { loadLoggedIn } from "@/lib/session-me-client";
import {
  enableWebPush,
  isIosBrowserTab,
  isStandalonePwa,
} from "@/lib/web-push-client";

const SKIP_PATH_PREFIXES = ["/admin", "/volunteer/login", "/work/"];

/** One-time: drop local "accepted" that was saved without a deliverable subscription. */
const FALSE_ACCEPT_FIX_KEY = "bloodlink_soft_push_deliverable_fix_v1";

function shouldSkipPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return SKIP_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p),
  );
}

async function serverPushSubscribed(): Promise<boolean> {
  try {
    const res = await fetch("/api/push/subscribe", { cache: "no-store" });
    if (res.status === 401 || !res.ok) return false;
    const data = (await res.json()) as { subscribed?: boolean };
    return Boolean(data.subscribed);
  } catch {
    return false;
  }
}

function clearFalseLocalAcceptOnce() {
  try {
    if (localStorage.getItem(FALSE_ACCEPT_FIX_KEY) === "1") return;
    localStorage.removeItem("bloodlink_push_accepted_v6");
    sessionStorage.removeItem("bloodlink_push_asked_session_v6");
    localStorage.setItem(FALSE_ACCEPT_FIX_KEY, "1");
  } catch {
    /* ignore */
  }
}

/**
 * Soft site-wide push ask: small Allow / Deny popup.
 * Allow only sticks after a real deliverable Web Push subscription is saved.
 * iPhone must Allow from the Home Screen app (not a Safari/Chrome tab).
 */
export function SoftSitePushAsk() {
  const { t } = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("");

  useEffect(() => {
    if (shouldSkipPath(pathname)) {
      setOpen(false);
      return;
    }

    let cancelled = false;

    async function boot() {
      await new Promise((r) => setTimeout(r, 900));
      if (cancelled) return;

      migratePushPromptStorage();
      clearFalseLocalAcceptOnce();

      const loggedIn = await loadLoggedIn({ force: true });
      if (cancelled) return;

      if (loggedIn) {
        const subscribed = await serverPushSubscribed();
        if (cancelled) return;
        if (subscribed) {
          markPushPromptAccepted();
          return;
        }
        // Local Accept without server row → ask again.
        clearPushPromptAccepted();
      }

      if (!shouldShowSoftPushAsk()) return;
      if (wasPushPromptShownThisSession()) return;
      markPushPromptShownThisSession();
      setOpen(true);
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  async function onAllow() {
    if (busy) return;
    setBusy(true);
    setHint("");
    try {
      // iPhone Safari/Chrome tabs cannot keep background daily alerts.
      if (isIosBrowserTab()) {
        setHint(t.pushIosHint);
        setBusy(false);
        return;
      }

      const loggedIn = await loadLoggedIn({ force: true });
      if (!loggedIn) {
        setHint(t.softPushLoginFirst);
        setBusy(false);
        return;
      }

      const result = await enableWebPush({
        recordIntent: true,
        forceRefresh: true,
        // Never save permission-only for this soft ask — daily alerts need
        // a deliverable subscription (Android Chrome / iOS Home Screen PWA).
        allowPermissionOnly: false,
      });

      if (result === "granted") {
        markPushPromptAccepted();
        setOpen(false);
        return;
      }

      if (result === "denied") {
        snoozePushPrompt(3);
        setOpen(false);
        return;
      }

      // Keep popup open so they can retry (e.g. after opening Home Screen app).
      setHint(
        isStandalonePwa() || !isIosBrowserTab()
          ? t.pushEnableError
          : t.pushIosHint,
      );
    } catch {
      setHint(t.pushEnableError);
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
        {hint ? (
          <p className="mt-2 text-center text-xs font-medium leading-relaxed text-[var(--blood)]">
            {hint}
          </p>
        ) : null}
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

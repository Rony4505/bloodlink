"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
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

const SKIP_PATH_PREFIXES = [
  "/login",
  "/register",
  "/join/",
  "/volunteer/login",
];

function shouldSkipPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return SKIP_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p),
  );
}

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

function browserPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return "unsupported";
  }
  return Notification.permission;
}

/**
 * Blocks until the donor allows notifications (or iOS permission-only is saved).
 * Never silently skips. If the browser already blocked notifications, the Allow
 * button shows loading + clear unblock steps (Chrome cannot reopen the system
 * dialog after Deny — user must Allow in site settings, then we retry).
 */
export function DonorPushEnableGate({ requireLogin = true }: Props) {
  const { t } = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [failHint, setFailHint] = useState("");
  const [hardDenied, setHardDenied] = useState(false);

  async function finishSuccess() {
    markPushPromptAccepted();
    setDone(true);
    setHardDenied(false);
    setFailHint("");
    window.setTimeout(() => setOpen(false), 700);
  }

  async function tryEnable(): Promise<boolean> {
    const result = await enableWebPush({
      recordIntent: true,
      forceRefresh: true,
      allowPermissionOnly: isLikelyIos(),
    });
    if (result === "granted" || result === "permission_only") {
      await finishSuccess();
      return true;
    }
    if (result === "denied" || browserPermission() === "denied") {
      setHardDenied(true);
      setFailHint(t.pushDeniedHint);
      return false;
    }
    setFailHint(t.pushEnableError);
    return false;
  }

  useEffect(() => {
    if (shouldSkipPath(pathname)) return;

    let cancelled = false;

    async function boot() {
      await new Promise((r) => setTimeout(r, 150));
      if (cancelled) return;

      migratePushPromptStorage();
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

      if (status.subscribed) {
        markPushPromptAccepted();
        return;
      }

      if (status.permissionOnly && isLikelyIos()) {
        markPushPromptAccepted();
        return;
      }

      if (browserPermission() === "granted") {
        const ok = await tryEnable();
        if (cancelled || ok) return;
      }

      if (cancelled) return;

      if (browserPermission() === "denied") {
        setHardDenied(true);
        setFailHint(t.pushDeniedHint);
      }

      setOpen(true);
    }

    void boot();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boot once per path/login
  }, [requireLogin, pathname]);

  // While open: if user unblocks notifications in Chrome settings and comes back, auto-subscribe.
  useEffect(() => {
    if (!open || done) return;
    let cancelled = false;

    async function tick() {
      if (cancelled) return;
      const perm = browserPermission();
      if (perm === "granted") {
        setBusy(true);
        try {
          await tryEnable();
        } finally {
          if (!cancelled) setBusy(false);
        }
      } else if (perm === "denied") {
        setHardDenied(true);
      }
    }

    const id = window.setInterval(() => void tick(), 1500);
    const onVis = () => {
      if (document.visibilityState === "visible") void tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, done]);

  async function onAllow() {
    setBusy(true);
    setFailHint("");
    try {
      // Always attempt — shows loading so the tap never feels dead.
      // If already denied, enableWebPush returns denied immediately; we then
      // show unblock steps. After the user Allows in site settings, the poll
      // above (or another tap) completes subscription.
      const ok = await tryEnable();
      if (!ok && browserPermission() === "denied") {
        setHardDenied(true);
        setFailHint(t.pushDeniedSteps);
      }
    } catch {
      setFailHint(t.pushEnableError);
    } finally {
      setBusy(false);
    }
  }

  if (!open || shouldSkipPath(pathname)) return null;

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

        {hardDenied ? (
          <div className="mt-3 space-y-2 rounded-xl bg-[color-mix(in_oklab,var(--blood)_10%,white)] px-3 py-3 text-sm text-[var(--blood)]">
            <p className="font-semibold">{t.pushDeniedBlockedTitle}</p>
            <ol className="list-decimal space-y-1 pl-4 text-xs leading-relaxed font-medium">
              <li>{t.pushDeniedStep1}</li>
              <li>{t.pushDeniedStep2}</li>
              <li>{t.pushDeniedStep3}</li>
              <li>{t.pushDeniedStep4}</li>
            </ol>
            <p className="text-xs font-medium opacity-90">{failHint || t.pushDeniedHint}</p>
          </div>
        ) : failHint ? (
          <p className="mt-3 rounded-xl bg-[color-mix(in_oklab,var(--blood)_10%,white)] px-3 py-2 text-sm font-medium text-[var(--blood)]">
            {failHint}
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
              {busy
                ? t.loading
                : hardDenied
                  ? t.registerPushRetry
                  : t.registerPushAllow}
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

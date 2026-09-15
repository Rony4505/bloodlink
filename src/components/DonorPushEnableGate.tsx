"use client";

import { useEffect, useRef, useState } from "react";
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

const DENIED_RELOAD_KEY = "bloodlink_push_denied_reload";
const SW_RELOAD_KEY = "bloodlink_push_sw_reload";

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

async function resetServiceWorkers() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
  } catch {
    /* ignore */
  }
}

/**
 * Tiny Allow gate — title + one button only.
 * If Chrome already blocked notifications, a tap reloads so site-settings
 * Allow is picked up; then we subscribe and close.
 */
export function DonorPushEnableGate({ requireLogin = true }: Props) {
  const { t } = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const enablingRef = useRef(false);

  async function finishSuccess() {
    try {
      sessionStorage.removeItem(DENIED_RELOAD_KEY);
      sessionStorage.removeItem(SW_RELOAD_KEY);
    } catch {
      /* ignore */
    }
    markPushPromptAccepted();
    setDone(true);
    window.setTimeout(() => setOpen(false), 500);
  }

  async function tryEnable(): Promise<"ok" | "denied" | "error"> {
    if (enablingRef.current) return "error";
    enablingRef.current = true;
    try {
      const result = await enableWebPush({
        recordIntent: true,
        forceRefresh: true,
        allowPermissionOnly: isLikelyIos(),
      });
      if (result === "granted" || result === "permission_only") {
        await finishSuccess();
        return "ok";
      }
      if (result === "denied" || browserPermission() === "denied") {
        return "denied";
      }
      return "error";
    } finally {
      enablingRef.current = false;
    }
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
        const outcome = await tryEnable();
        if (cancelled || outcome === "ok") return;
      }

      if (cancelled) return;
      setOpen(true);
    }

    void boot();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boot once per path/login
  }, [requireLogin, pathname]);

  // When user returns from Chrome settings with Allow, subscribe automatically.
  useEffect(() => {
    if (!open || done) return;
    let cancelled = false;

    async function tick() {
      if (cancelled || enablingRef.current) return;
      if (browserPermission() !== "granted") return;
      setBusy(true);
      try {
        await tryEnable();
      } finally {
        if (!cancelled) setBusy(false);
      }
    }

    const id = window.setInterval(() => void tick(), 1200);
    const onVis = () => {
      if (document.visibilityState === "visible") void tick();
    };
    const onPageShow = () => void tick();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pageshow", onPageShow);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, done]);

  async function onAllow() {
    if (busy || done) return;
    setBusy(true);
    try {
      const perm = browserPermission();

      // Chrome cannot re-open the system prompt after Deny. A full reload is
      // the reliable way to pick up Site settings → Notifications → Allow.
      if (perm === "denied") {
        try {
          sessionStorage.setItem(DENIED_RELOAD_KEY, "1");
        } catch {
          /* ignore */
        }
        window.location.reload();
        return;
      }

      const outcome = await tryEnable();
      if (outcome === "ok") return;

      // Permission is granted but subscribe failed — reset SW and reload once.
      if (browserPermission() === "granted") {
        let alreadyReloaded = false;
        try {
          alreadyReloaded = sessionStorage.getItem(SW_RELOAD_KEY) === "1";
        } catch {
          /* ignore */
        }
        if (!alreadyReloaded) {
          try {
            sessionStorage.setItem(SW_RELOAD_KEY, "1");
          } catch {
            /* ignore */
          }
          await resetServiceWorkers();
          window.location.reload();
          return;
        }
      }
    } catch {
      /* keep modal open for another tap */
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
        className="animate-[rise_0.35s_ease-out] w-full max-w-sm rounded-[28px] border border-[var(--line)] bg-[linear-gradient(165deg,#fff8f4_0%,var(--mist)_45%,#f3ebe4_100%)] p-6 shadow-2xl sm:p-7"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2
          id="push-ask-title"
          className="text-center font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[var(--blood-deep)]"
        >
          {t.registerPushTitle}
        </h2>

        {done ? (
          <p className="mt-4 text-center text-sm font-medium text-[var(--sage)]">
            {t.registerPushOn}
          </p>
        ) : (
          <div className="mt-6">
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

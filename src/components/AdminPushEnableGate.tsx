"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  canAskNotificationPermission,
  canUseFullWebPush,
  classifyWebPushFailure,
  enableWebPush,
  isIosBrowserTab,
  isWebPushSupported,
  type EnableWebPushResult,
} from "@/lib/web-push-client";
import { migratePushPromptStorage } from "@/lib/push-prompt-state";

const ADMIN_PUSH_URLS = {
  statusUrl: "/api/admin/push/subscribe",
  saveUrl: "/api/admin/push/subscribe",
} as const;

async function fetchAdminPushStatus(): Promise<boolean> {
  try {
    const res = await fetch(ADMIN_PUSH_URLS.statusUrl, {
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { subscribed?: boolean };
    return Boolean(data.subscribed);
  } catch {
    return false;
  }
}

/**
 * Always-visible admin push card.
 * On iPhone Chrome/Safari tabs, show Home Screen instructions instead of a
 * misleading "use Chrome" error (iOS Chrome cannot deliver background push).
 */
export function AdminPushEnableGate() {
  const { t } = useLocale();
  const [ready, setReady] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [testBusy, setTestBusy] = useState(false);
  const [testMsg, setTestMsg] = useState("");
  const [iosTab, setIosTab] = useState(false);

  const failureMessage = useCallback(
    (result: EnableWebPushResult) => {
      const kind = classifyWebPushFailure(result);
      if (kind === "ios_home_screen_required") return t.pushIosPwaRequired;
      if (kind === "denied") return t.pushDenied;
      if (kind === "unsupported") return t.pushUnsupported;
      return t.pushEnableError;
    },
    [t],
  );

  const syncAdminPush = useCallback(
    async (opts?: { interactive?: boolean }) => {
      const interactive = opts?.interactive === true;

      if (!canAskNotificationPermission()) {
        if (interactive) setError(t.pushUnsupported);
        return false;
      }

      // iPhone browser tab cannot create a deliverable push subscription.
      if (isIosBrowserTab() || !canUseFullWebPush()) {
        if (interactive) {
          setError(
            isIosBrowserTab() ? t.pushIosPwaRequired : t.pushUnsupported,
          );
        }
        setSubscribed(false);
        return false;
      }

      if (!isWebPushSupported()) {
        if (interactive) setError(t.pushUnsupported);
        return false;
      }

      if (await fetchAdminPushStatus()) {
        setSubscribed(true);
        setError("");
        return true;
      }

      if (Notification.permission === "granted" || interactive) {
        const result = await enableWebPush({
          ...ADMIN_PUSH_URLS,
          forceRefresh: true,
          allowPermissionOnly: false,
          recordIntent: interactive,
        });
        if (result === "granted") {
          setSubscribed(true);
          setError("");
          return true;
        }
        if (interactive) setError(failureMessage(result));
        setSubscribed(false);
        return false;
      }

      setSubscribed(false);
      return false;
    },
    [failureMessage, t.pushDenied, t.pushIosPwaRequired, t.pushUnsupported],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      migratePushPromptStorage();
      try {
        localStorage.removeItem("bloodlink_admin_push_dismissed");
        localStorage.removeItem("bloodlink_admin_push_snooze");
        sessionStorage.removeItem("bloodlink_admin_push_asked_session_v3");
        sessionStorage.removeItem("bloodlink_admin_push_asked_session_v4");
      } catch {
        /* ignore */
      }

      setIosTab(isIosBrowserTab());
      // Force latest SW so push display handler is current.
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        await reg.update().catch(() => undefined);
      } catch {
        /* ignore */
      }
      await syncAdminPush({ interactive: false });
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [syncAdminPush]);

  if (!ready) return null;

  const bodyText = subscribed
    ? t.adminPushActive
    : iosTab
      ? t.adminPushIosBody
      : t.adminPushBody;

  return (
    <div
      className={`rounded-2xl border px-4 py-4 shadow-sm ${
        subscribed
          ? "border-[color-mix(in_oklab,#2f6b4f_28%,transparent)] bg-[linear-gradient(160deg,#f0faf4,#ffffff)]"
          : "border-[color-mix(in_oklab,var(--blood)_22%,transparent)] bg-[linear-gradient(160deg,#fff4f1,#ffffff)]"
      }`}
    >
      <p className="text-sm font-semibold text-[var(--blood-deep)]">{t.adminPushTitle}</p>
      <p className="mt-1 text-xs leading-relaxed text-[color-mix(in_oklab,var(--ink)_65%,white)]">
        {bodyText}
      </p>
      {iosTab && !subscribed ? (
        <p className="mt-2 text-xs font-medium text-[var(--blood-deep)]">
          {t.pushIosHint}
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-xs font-medium text-[var(--blood)]">{error}</p>
      ) : null}
      {testMsg ? (
        <p className="mt-2 text-xs font-medium text-[var(--blood-deep)]">{testMsg}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {!subscribed ? (
          <button
            type="button"
            className="btn-primary"
            disabled={busy || testBusy}
            onClick={() => {
              setBusy(true);
              setError("");
              setTestMsg("");
              void (async () => {
                try {
                  const ok = await syncAdminPush({ interactive: true });
                  if (!ok && !error) {
                    setError(
                      isIosBrowserTab()
                        ? t.pushIosPwaRequired
                        : t.pushEnableError,
                    );
                  }
                } finally {
                  setBusy(false);
                }
              })();
            }}
          >
            {busy ? t.loading : t.adminPushAllow}
          </button>
        ) : null}

        <button
          type="button"
          className={subscribed ? "btn-primary" : "btn-ghost"}
          disabled={testBusy || busy}
          onClick={() => {
            setTestBusy(true);
            setTestMsg("");
            setError("");
            void (async () => {
              try {
                if (isIosBrowserTab() && !(await fetchAdminPushStatus())) {
                  setTestMsg(t.pushIosPwaRequired);
                  return;
                }
                if (!(await fetchAdminPushStatus())) {
                  const repaired = await syncAdminPush({ interactive: true });
                  if (!repaired) {
                    setTestMsg(
                      isIosBrowserTab()
                        ? t.pushIosPwaRequired
                        : t.pushEnableError,
                    );
                    return;
                  }
                }
                const res = await fetch("/api/admin/push/test", {
                  method: "POST",
                  credentials: "same-origin",
                });
                const data = (await res.json()) as {
                  ok?: boolean;
                  sent?: number;
                  error?: string;
                };
                if (!res.ok) {
                  setTestMsg(data.error || t.pushEnableError);
                  setSubscribed(false);
                  return;
                }
                if ((data.sent ?? 0) < 1) {
                  setSubscribed(false);
                  setTestMsg(
                    data.error ||
                      "Push saved but delivery failed — tap Allow admin push again.",
                  );
                  return;
                }
                setSubscribed(true);
                // Local fallback so the admin sees a tray notification even if
                // background delivery is delayed/suppressed by the OS.
                try {
                  const reg =
                    (await navigator.serviceWorker.getRegistration("/sw.js")) ||
                    (await navigator.serviceWorker.register("/sw.js", {
                      scope: "/",
                    }));
                  await reg.update().catch(() => undefined);
                  await navigator.serviceWorker.ready;
                  await reg.showNotification("BloodLink Admin", {
                    body: "টেস্ট push সফল — অ্যাডমিন নোটিফিকেশন কাজ করছে।",
                    icon: "/icons/icon-192.png",
                    badge: "/icons/icon-192.png",
                    tag: `admin-local-test-${Date.now()}`,
                    requireInteraction: true,
                    silent: false,
                    data: { url: "/admin" },
                  });
                } catch {
                  /* remote push may still arrive */
                }
                setTestMsg(
                  t.adminPushTestSent.replace("{sent}", String(data.sent ?? 0)),
                );
              } catch {
                setTestMsg(t.pushEnableError);
              } finally {
                setTestBusy(false);
              }
            })();
          }}
        >
          {testBusy ? t.loading : t.adminPushTest}
        </button>

        {subscribed ? (
          <button
            type="button"
            className="btn-ghost"
            disabled={testBusy || busy}
            onClick={() => {
              setTestBusy(true);
              setTestMsg("");
              void (async () => {
                try {
                  const res = await fetch("/api/admin/push/test", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "same-origin",
                    body: JSON.stringify({ broadcast: true }),
                  });
                  const data = (await res.json()) as {
                    ok?: boolean;
                    sent?: number;
                    error?: string;
                  };
                  if (!res.ok) {
                    setTestMsg(data.error || t.pushEnableError);
                    return;
                  }
                  setTestMsg(
                    t.adminPushTestSent.replace("{sent}", String(data.sent ?? 0)),
                  );
                } catch {
                  setTestMsg(t.pushEnableError);
                } finally {
                  setTestBusy(false);
                }
              })();
            }}
          >
            {testBusy ? t.loading : t.adminPushBroadcast}
          </button>
        ) : null}
      </div>
    </div>
  );
}

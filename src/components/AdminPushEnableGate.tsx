"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  canAskNotificationPermission,
  enableWebPush,
  isWebPushSupported,
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
 * Re-syncs the deliverable admin subscription whenever the panel loads.
 * Session skip must never block silent repair — that was breaking admin push.
 */
export function AdminPushEnableGate() {
  const { t } = useLocale();
  const [ready, setReady] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [testBusy, setTestBusy] = useState(false);
  const [testMsg, setTestMsg] = useState("");

  const syncAdminPush = useCallback(
    async (opts?: { interactive?: boolean }) => {
      const interactive = opts?.interactive === true;
      if (!canAskNotificationPermission() || !isWebPushSupported()) {
        if (interactive) setError(t.pushEnableError);
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
        if (interactive) setError(t.pushEnableError);
        setSubscribed(false);
        return false;
      }

      setSubscribed(false);
      return false;
    },
    [t.pushEnableError],
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

      await syncAdminPush({ interactive: false });
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [syncAdminPush]);

  if (!ready) return null;

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
        {subscribed ? t.adminPushActive : t.adminPushBody}
      </p>
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
                  if (!ok) setError(t.pushEnableError);
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
                if (!(await fetchAdminPushStatus())) {
                  const repaired = await syncAdminPush({ interactive: true });
                  if (!repaired) {
                    setTestMsg(t.pushEnableError);
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

"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  canAskNotificationPermission,
  enableWebPush,
  isWebPushSupported,
} from "@/lib/web-push-client";
import { migratePushPromptStorage } from "@/lib/push-prompt-state";

const ADMIN_PUSH_SESSION_KEY = "bloodlink_admin_push_asked_session_v3";

async function fetchAdminPushStatus(): Promise<boolean> {
  try {
    const res = await fetch("/api/admin/push/subscribe", { cache: "no-store" });
    if (!res.ok) return false;
    const data = (await res.json()) as { subscribed?: boolean };
    return Boolean(data.subscribed);
  } catch {
    return false;
  }
}

/** Admin push enable card — always requires a deliverable server subscription. */
export function AdminPushEnableGate() {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [testBusy, setTestBusy] = useState(false);
  const [testMsg, setTestMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      migratePushPromptStorage();
      // Clear legacy forever-dismiss so rebuild can re-prompt.
      localStorage.removeItem("bloodlink_admin_push_dismissed");
      localStorage.removeItem("bloodlink_admin_push_snooze");

      if (!canAskNotificationPermission()) return;
      if (sessionStorage.getItem(ADMIN_PUSH_SESSION_KEY) === "1") return;

      const subscribed = await fetchAdminPushStatus();
      if (cancelled) return;
      if (subscribed) {
        setDone(true);
        return;
      }

      // Silent recover if browser already granted.
      if (Notification.permission === "granted" && isWebPushSupported()) {
        const result = await enableWebPush({
          statusUrl: "/api/admin/push/subscribe",
          saveUrl: "/api/admin/push/subscribe",
          forceRefresh: true,
          allowPermissionOnly: false,
        });
        if (cancelled) return;
        if (result === "granted") {
          setDone(true);
          return;
        }
      }

      if (Notification.permission === "denied") return;

      sessionStorage.setItem(ADMIN_PUSH_SESSION_KEY, "1");
      setVisible(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (done) {
    return (
      <div className="rounded-2xl border border-[color-mix(in_oklab,#2f6b4f_28%,transparent)] bg-[linear-gradient(160deg,#f0faf4,#ffffff)] px-4 py-4 shadow-sm">
        <p className="text-sm font-semibold text-[var(--blood-deep)]">{t.adminPushTitle}</p>
        <p className="mt-1 text-xs text-[color-mix(in_oklab,var(--ink)_65%,white)]">
          {t.adminPushActive}
        </p>
        {testMsg ? (
          <p className="mt-2 text-xs font-medium text-[var(--blood-deep)]">{testMsg}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary"
            disabled={testBusy}
            onClick={() => {
              setTestBusy(true);
              setTestMsg("");
              void (async () => {
                try {
                  const res = await fetch("/api/admin/push/test", { method: "POST" });
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
            {testBusy ? t.loading : t.adminPushTest}
          </button>
          <button
            type="button"
            className="btn-ghost"
            disabled={testBusy}
            onClick={() => {
              setTestBusy(true);
              setTestMsg("");
              void (async () => {
                try {
                  const res = await fetch("/api/admin/push/test", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ broadcast: true }),
                  });
                  const data = (await res.json()) as {
                    ok?: boolean;
                    sent?: number;
                    userCount?: number;
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
        </div>
      </div>
    );
  }

  if (!visible) return null;

  return (
    <div className="rounded-2xl border border-[color-mix(in_oklab,var(--blood)_22%,transparent)] bg-[linear-gradient(160deg,#fff4f1,#ffffff)] px-4 py-4 shadow-sm">
      <p className="text-sm font-semibold text-[var(--blood-deep)]">{t.adminPushTitle}</p>
      <p className="mt-1 text-xs leading-relaxed text-[color-mix(in_oklab,var(--ink)_65%,white)]">
        {t.adminPushBody}
      </p>
      {error ? (
        <p className="mt-2 text-xs font-medium text-[var(--blood)]">{error}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          className="btn-primary"
          onClick={() => {
            setBusy(true);
            setError("");
            void (async () => {
              try {
                if (!isWebPushSupported()) {
                  setError(t.pushEnableError);
                  return;
                }
                const result = await enableWebPush({
                  statusUrl: "/api/admin/push/subscribe",
                  saveUrl: "/api/admin/push/subscribe",
                  forceRefresh: true,
                  allowPermissionOnly: false,
                  recordIntent: true,
                });
                if (result === "granted") {
                  setDone(true);
                  setVisible(false);
                  return;
                }
                setError(t.pushEnableError);
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          {busy ? t.loading : t.adminPushAllow}
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => setVisible(false)}
        >
          {t.registerPushSkip}
        </button>
      </div>
    </div>
  );
}

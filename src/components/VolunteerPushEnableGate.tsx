"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  clearPushPromptAccepted,
  markPushPromptAccepted,
  migratePushPromptStorage,
  shouldSkipPushPrompt,
} from "@/lib/push-prompt-state";
import {
  canUseWebPushHere,
  chromeIntentUrl,
  isInAppBrowser,
} from "@/lib/browser-env";
import { enableWebPush } from "@/lib/web-push-client";

type GateStatus = "loading" | "ask" | "on" | "denied" | "unsupported" | "error";

type Props = {
  token: string;
  publicKey: string | null;
  notificationsEnabled: boolean;
  onSubscribed?: () => void;
};

export function VolunteerPushEnableGate({
  token,
  publicKey,
  notificationsEnabled,
  onSubscribed,
}: Props) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<GateStatus>("loading");
  const [inlineOn, setInlineOn] = useState(false);
  const [copyDone, setCopyDone] = useState(false);

  const workUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/work/${encodeURIComponent(token)}`;
  }, [token]);

  const inApp = useMemo(() => isInAppBrowser(), []);
  const pushSupported = useMemo(() => canUseWebPushHere(), []);

  const checkStatus = useCallback(async () => {
    migratePushPromptStorage();
    if (!notificationsEnabled) {
      setStatus("error");
      return;
    }
    if (!pushSupported || !publicKey) {
      setStatus("unsupported");
      setOpen(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/public/volunteer/${encodeURIComponent(token)}/push`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const data = (await res.json()) as { subscribed?: boolean };
        if (data.subscribed) {
          markPushPromptAccepted();
          setStatus("on");
          setInlineOn(true);
          setOpen(false);
          return;
        }
      }

      // Browser already granted — finish subscribe so admin sees Allow.
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        setStatus("loading");
        const result = await enableWebPush({
          statusUrl: `/api/public/volunteer/${encodeURIComponent(token)}/push`,
          saveUrl: `/api/public/volunteer/${encodeURIComponent(token)}/push`,
          forceRefresh: true,
          allowPermissionOnly: false,
          recordIntent: true,
        });
        if (result === "granted") {
          markPushPromptAccepted();
          setStatus("on");
          setInlineOn(true);
          setOpen(false);
          onSubscribed?.();
          return;
        }
      }

      if (shouldSkipPushPrompt()) {
        clearPushPromptAccepted();
      }

      setStatus("ask");
      setOpen(true);
    } catch {
      setStatus("ask");
      setOpen(true);
    }
  }, [notificationsEnabled, publicKey, pushSupported, token, onSubscribed]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void checkStatus();
    }, 350);
    return () => window.clearTimeout(id);
  }, [checkStatus]);

  async function onAllow() {
    if (!publicKey || !pushSupported) {
      setStatus("unsupported");
      return;
    }
    setBusy(true);
    setStatus("loading");
    try {
      const result = await enableWebPush({
        statusUrl: `/api/public/volunteer/${encodeURIComponent(token)}/push`,
        saveUrl: `/api/public/volunteer/${encodeURIComponent(token)}/push`,
        forceRefresh: true,
        allowPermissionOnly: false,
        recordIntent: true,
      });
      if (result === "granted") {
        markPushPromptAccepted();
        setStatus("on");
        setInlineOn(true);
        onSubscribed?.();
        window.setTimeout(() => setOpen(false), 1000);
        return;
      }
      if (result === "denied") {
        setStatus("denied");
        return;
      }
      setStatus("error");
    } catch {
      setStatus("error");
    } finally {
      setBusy(false);
    }
  }

  async function copyWorkUrl() {
    try {
      await navigator.clipboard.writeText(workUrl);
      setCopyDone(true);
      window.setTimeout(() => setCopyDone(false), 2000);
    } catch {
      /* ignore */
    }
  }

  function openInChrome() {
    const intent = chromeIntentUrl(workUrl);
    if (intent) {
      window.location.href = intent;
      return;
    }
    window.open(workUrl, "_blank", "noopener,noreferrer");
  }

  const bodyText =
    status === "on" || inlineOn
      ? t.volunteerPushActiveNow
      : status === "denied"
        ? t.volunteerPushDenied
        : status === "unsupported"
          ? inApp
            ? t.volunteerPushInAppBrowser
            : t.volunteerPushUnavailable
          : status === "error"
            ? t.volunteerPushRetryHint
            : t.volunteerNotificationsHint;

  if (!notificationsEnabled) return null;

  return (
    <>
      <section className="rounded-2xl border border-[var(--line)] bg-white/90 p-5 shadow-sm">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
          {t.volunteerNotificationsTitle}
        </h2>
        <p
          className={`mt-2 text-sm leading-relaxed ${
            inlineOn || status === "on"
              ? "font-semibold text-[var(--sage)]"
              : "text-[color-mix(in_oklab,var(--ink)_62%,white)]"
          }`}
        >
          {bodyText}
        </p>

        {status === "unsupported" ? (
          <div className="mt-3 space-y-2">
            <p className="text-xs leading-relaxed text-[color-mix(in_oklab,var(--ink)_55%,white)]">
              {t.volunteerPushOpenChromeHint}
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-primary" onClick={openInChrome}>
                {t.volunteerPushOpenChrome}
              </button>
              <button type="button" className="btn-ghost" onClick={() => void copyWorkUrl()}>
                {copyDone ? t.volunteerUrlCopied : t.volunteerPushCopyLink}
              </button>
            </div>
          </div>
        ) : null}

        {!inlineOn &&
        status !== "on" &&
        status !== "denied" &&
        status !== "unsupported" ? (
          <button
            type="button"
            className="btn-primary mt-3"
            disabled={busy || status === "loading"}
            onClick={() => void onAllow()}
          >
            {busy || status === "loading" ? t.loading : t.volunteerEnablePush}
          </button>
        ) : null}

        {status === "error" ? (
          <button
            type="button"
            className="btn-ghost mt-2"
            disabled={busy}
            onClick={() => void onAllow()}
          >
            {t.retry}
          </button>
        ) : null}
      </section>

      {open && status !== "on" && status !== "unsupported" && !inlineOn ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-4 backdrop-blur-[2px] sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-[28px] border border-[var(--line)] bg-white p-6 shadow-2xl"
          >
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--blood-deep)]">
              {t.volunteerNotificationsTitle}
            </h2>
            <p className="mt-2 text-sm text-[color-mix(in_oklab,var(--ink)_72%,white)]">
              {bodyText}
            </p>
            {status === "ask" || status === "loading" || status === "error" ? (
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onAllow()}
                  className="btn-primary flex-1"
                >
                  {busy ? t.loading : t.volunteerEnablePush}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setOpen(false)}
                  className="btn-ghost flex-1"
                >
                  {t.registerPushSkip}
                </button>
              </div>
            ) : status === "denied" ? (
              <button
                type="button"
                className="btn-ghost mt-5 w-full"
                onClick={() => setOpen(false)}
              >
                {t.close}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

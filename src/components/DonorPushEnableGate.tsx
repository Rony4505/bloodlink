"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  canAskNotificationPermission,
  enableWebPush,
  isWebPushSupported,
} from "@/lib/web-push-client";
import { loadLoggedIn } from "@/lib/session-me-client";

type GateStatus = "ask" | "on" | "denied" | "error";

type Props = {
  /** When true, only runs if the visitor is a logged-in donor. */
  requireLogin?: boolean;
  /** Show the full-screen allow dialog (default true). */
  modal?: boolean;
  /** When true, render a persistent card as well / instead. */
  showCard?: boolean;
};

async function fetchPushStatus(): Promise<{
  ok: boolean;
  subscribed: boolean;
}> {
  try {
    const res = await fetch("/api/push/subscribe", { cache: "no-store" });
    if (res.status === 401) return { ok: false, subscribed: false };
    if (!res.ok) return { ok: true, subscribed: false };
    const data = (await res.json()) as { subscribed?: boolean };
    return { ok: true, subscribed: Boolean(data.subscribed) };
  } catch {
    return { ok: true, subscribed: false };
  }
}

/**
 * Existing logged-in donors without a saved push subscription get an Allow
 * prompt on every browser — including iPhone Safari/Chrome.
 */
export function DonorPushEnableGate({
  requireLogin = true,
  modal = true,
  showCard = false,
}: Props) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [card, setCard] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<GateStatus>("ask");
  const [hint, setHint] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      await new Promise((r) => setTimeout(r, 120));
      if (cancelled) return;

      if (requireLogin) {
        let ok = await loadLoggedIn({ force: true });
        if (!ok) {
          await new Promise((r) => setTimeout(r, 350));
          ok = await loadLoggedIn({ force: true });
        }
        if (!ok || cancelled) return;
      }

      let statusRes = await fetchPushStatus();
      if (!statusRes.ok) {
        await new Promise((r) => setTimeout(r, 400));
        statusRes = await fetchPushStatus();
      }
      if (cancelled) return;

      if (statusRes.subscribed) {
        localStorage.setItem("bloodlink_push_on", "1");
        setOpen(false);
        setCard(false);
        return;
      }

      localStorage.removeItem("bloodlink_push_on");

      // Always offer Allow — never block iPhone/other browsers behind Close-only UI.
      if (canAskNotificationPermission() && Notification.permission === "denied") {
        setStatus("denied");
      } else {
        setStatus("ask");
        if (!isWebPushSupported()) {
          setHint(t.pushIosHint);
        }
      }

      if (
        canAskNotificationPermission() &&
        Notification.permission === "granted" &&
        isWebPushSupported()
      ) {
        const result = await enableWebPush();
        if (cancelled) return;
        if (result === "granted") {
          localStorage.setItem("bloodlink_push_on", "1");
          setOpen(false);
          setCard(false);
          return;
        }
      }

      if (modal) setOpen(true);
      if (showCard) setCard(true);
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [requireLogin, showCard, modal, t.pushIosHint]);

  async function onAllow() {
    setBusy(true);
    setHint("");
    try {
      const result = await enableWebPush({ recordIntent: true });
      if (result === "granted") {
        setStatus("on");
        localStorage.setItem("bloodlink_push_on", "1");
        window.setTimeout(() => {
          setOpen(false);
          setCard(false);
        }, 900);
        return;
      }
      if (result === "denied") {
        setStatus("denied");
        return;
      }
      if (result === "unsupported") {
        setStatus("error");
        setHint(t.pushUnsupported);
        return;
      }
      setStatus("error");
      setHint(t.pushEnableError);
    } catch {
      setStatus("error");
      setHint(t.pushEnableError);
    } finally {
      setBusy(false);
    }
  }

  const bodyText =
    status === "denied"
      ? t.pushDenied
      : status === "error"
        ? hint || t.pushEnableError
        : t.registerPushBody;

  const showAllowActions = status === "ask" || status === "error";

  const panel = (
    <>
      <h2
        id="push-ask-title"
        className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[var(--blood-deep)]"
      >
        {t.registerPushTitle}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[color-mix(in_oklab,var(--ink)_72%,white)]">
        {bodyText}
      </p>
      {status === "ask" && hint ? (
        <p className="mt-2 text-xs leading-relaxed text-[color-mix(in_oklab,var(--ink)_55%,white)]">
          {hint}
        </p>
      ) : null}

      {status === "on" ? (
        <p className="mt-4 text-sm font-medium text-[var(--sage)]">{t.registerPushOn}</p>
      ) : null}

      {showAllowActions ? (
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
            onClick={() => setOpen(false)}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--mist)] disabled:opacity-60"
          >
            {t.registerPushSkip}
          </button>
        </div>
      ) : status === "denied" ? (
        <div className="mt-5 flex flex-col gap-2">
          <p className="text-xs text-[color-mix(in_oklab,var(--ink)_60%,white)]">
            {t.pushDeniedHint}
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex w-full items-center justify-center rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--ink)]"
          >
            {t.close}
          </button>
        </div>
      ) : null}
    </>
  );

  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-4 backdrop-blur-[2px] sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="push-ask-title"
            className="animate-[rise_0.35s_ease-out] w-full max-w-md rounded-[28px] border border-[var(--line)] bg-[linear-gradient(165deg,#fff8f4_0%,var(--mist)_45%,#f3ebe4_100%)] p-6 shadow-2xl sm:p-7"
          >
            {panel}
          </div>
        </div>
      ) : null}

      {showCard && card && status !== "on" ? (
        <div className="mb-4 rounded-2xl border border-[color-mix(in_oklab,var(--blood)_22%,transparent)] bg-[linear-gradient(160deg,#fff4f1,#ffffff)] px-4 py-4 shadow-sm">
          <p className="text-sm font-semibold text-[var(--blood-deep)]">
            {t.registerPushTitle}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[color-mix(in_oklab,var(--ink)_65%,white)]">
            {bodyText}
          </p>
          {showAllowActions ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onAllow()}
              className="btn-primary mt-3"
            >
              {busy ? t.loading : t.registerPushAllow}
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

/** @deprecated use DonorPushEnableGate */
export function NotificationsPushAskModal() {
  return <DonorPushEnableGate requireLogin />;
}

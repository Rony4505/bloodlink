"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  hasAcceptedPushPrompt,
  isPushPromptSnoozed,
  markPushPromptAccepted,
  markPushPromptShownThisSession,
  snoozePushPrompt,
  wasPushPromptShownThisSession,
} from "@/lib/push-prompt-state";
import { enableWebPush } from "@/lib/web-push-client";
import { loadLoggedIn } from "@/lib/session-me-client";

type Props = {
  requireLogin?: boolean;
};

async function fetchAlreadyEnabled(): Promise<boolean> {
  try {
    const res = await fetch("/api/push/subscribe", { cache: "no-store" });
    if (res.status === 401 || !res.ok) return false;
    const data = (await res.json()) as {
      subscribed?: boolean;
      permissionOnly?: boolean;
    };
    return Boolean(data.subscribed || data.permissionOnly);
  } catch {
    return false;
  }
}

/**
 * Simple notification Allow popup for logged-in donors.
 * - Allow once → never again on this device
 * - Not now → again after 30 days
 */
export function DonorPushEnableGate({ requireLogin = true }: Props) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      await new Promise((r) => setTimeout(r, 200));
      if (cancelled) return;

      if (hasAcceptedPushPrompt() || isPushPromptSnoozed()) return;
      if (wasPushPromptShownThisSession()) return;

      if (requireLogin) {
        let ok = await loadLoggedIn({ force: true });
        if (!ok) {
          await new Promise((r) => setTimeout(r, 350));
          ok = await loadLoggedIn({ force: true });
        }
        if (!ok || cancelled) return;
      }

      if (await fetchAlreadyEnabled()) {
        markPushPromptAccepted();
        return;
      }
      if (cancelled) return;

      markPushPromptShownThisSession();
      setOpen(true);
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [requireLogin]);

  function onSkip() {
    snoozePushPrompt(30);
    setOpen(false);
  }

  async function onAllow() {
    setBusy(true);
    try {
      const result = await enableWebPush({ recordIntent: true });
      if (result === "granted") {
        markPushPromptAccepted();
        setDone(true);
        window.setTimeout(() => setOpen(false), 800);
        return;
      }
      // Denied or failed — treat like skip (ask again in 30 days)
      snoozePushPrompt(30);
      setOpen(false);
    } catch {
      snoozePushPrompt(30);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-4 backdrop-blur-[2px] sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="push-ask-title"
        className="animate-[rise_0.35s_ease-out] w-full max-w-md rounded-[28px] border border-[var(--line)] bg-[linear-gradient(165deg,#fff8f4_0%,var(--mist)_45%,#f3ebe4_100%)] p-6 shadow-2xl sm:p-7"
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

        {done ? (
          <p className="mt-4 text-sm font-medium text-[var(--sage)]">{t.registerPushOn}</p>
        ) : (
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
              onClick={onSkip}
              className="inline-flex flex-1 items-center justify-center rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--mist)] disabled:opacity-60"
            >
              {t.registerPushSkip}
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

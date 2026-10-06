"use client";

import { useEffect } from "react";
import { markAppInstalled } from "@/lib/app-install-state";
import { isLaunchedFromPlayApp, isStandaloneDisplay } from "@/lib/browser-env";
import { subscribeSessionMe } from "@/lib/session-me-client";

const ID_KEY = "bloodlink_install_id";
const PING_KEY = "bloodlink_install_ping";
const PING_EVERY_MS = 6 * 60 * 60 * 1000;

function installId(): string | null {
  try {
    let id = localStorage.getItem(ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ID_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** "play" when launched from the Play Store TWA, "pwa" when running standalone from the browser. */
function installSource(): "play" | "pwa" | null {
  if (isLaunchedFromPlayApp()) return "play";
  if (!isStandaloneDisplay()) return null;
  // Android standalone without a browser UA hint is almost always the Play TWA.
  return /android/i.test(navigator.userAgent) && !/wv\)/i.test(navigator.userAgent)
    ? "play"
    : "pwa";
}

function ping(source: "play" | "pwa", force = false) {
  // Running as the app means this device has it — stop the install bar here too.
  markAppInstalled();
  const id = installId();
  if (!id) return;
  try {
    const last = Number(localStorage.getItem(PING_KEY) || 0);
    if (!force && Date.now() - last < PING_EVERY_MS) return;
    localStorage.setItem(PING_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
  void fetch("/api/app/installs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ installId: id, source }),
    keepalive: true,
  }).catch(() => undefined);
}

/**
 * Tells the server when BloodLink is running as an installed app so the admin
 * can see who installed it. Pings at most every 6h per device, immediately on
 * `appinstalled`, and again right after a donor logs in (to link the install).
 */
export function AppInstallTracker() {
  useEffect(() => {
    const source = installSource();
    if (source) ping(source);

    const onInstalled = () => ping("pwa", true);
    window.addEventListener("appinstalled", onInstalled);

    const unsub = subscribeSessionMe((loggedIn) => {
      const now = installSource();
      if (loggedIn && now) ping(now, true);
    });
    return () => {
      window.removeEventListener("appinstalled", onInstalled);
      unsub();
    };
  }, []);
  return null;
}

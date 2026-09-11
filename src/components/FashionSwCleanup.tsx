"use client";

import { useEffect } from "react";
import { clientAppMode } from "@/lib/app-mode";

/**
 * Noorzaa must never keep a BloodLink service worker / shell cache.
 * Stale SW on noorzaa.com is the usual reason BloodLink "flashes" until hard refresh.
 */
export function FashionSwCleanup() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (clientAppMode() !== "fashion") return;
    if (!("serviceWorker" in navigator)) return;

    const flag = "noorzaa_sw_cleaned_v2";
    if (sessionStorage.getItem(flag) === "1") return;

    let cancelled = false;

    async function wipe() {
      let hadController = Boolean(navigator.serviceWorker.controller);
      let unregistered = 0;
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        unregistered = regs.length;
        await Promise.all(regs.map((r) => r.unregister()));
      } catch {
        /* ignore */
      }
      try {
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      } catch {
        /* ignore */
      }
      if (cancelled) return;
      sessionStorage.setItem(flag, "1");
      if (hadController || unregistered > 0) {
        window.location.reload();
      }
    }

    void wipe();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

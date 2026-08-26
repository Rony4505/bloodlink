"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";

function bdParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
  return {
    key: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

export function DailyReminder({ enabled }: { enabled: boolean }) {
  const { t } = useLocale();
  const [hourBd, setHourBd] = useState(10);
  const [reminderEnabled, setReminderEnabled] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const daily = data?.prefs?.dailyDonationReminder;
        if (!daily) return;
        setReminderEnabled(Boolean(daily.enabled));
        if (typeof daily.hourBd === "number") setHourBd(daily.hourBd);
      })
      .catch(() => undefined);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !reminderEnabled || typeof window === "undefined") return;

    async function tick() {
      const { key, hour, minute } = bdParts();
      if (hour !== hourBd || minute > 8) return;

      const storageKey = `bloodlink_daily_${key}_${hourBd}`;
      if (localStorage.getItem(storageKey)) return;

      await fetch("/api/notifications").catch(() => undefined);

      if ("Notification" in window) {
        if (Notification.permission === "default") {
          await Notification.requestPermission();
        }
        if (Notification.permission === "granted") {
          new Notification(t.dailyReminderTitle, {
            body: t.dailyReminderBody,
          });
        }
      }

      localStorage.setItem(storageKey, "1");
    }

    void tick();
    const id = window.setInterval(() => void tick(), 60_000);
    return () => window.clearInterval(id);
  }, [enabled, hourBd, reminderEnabled, t.dailyReminderBody, t.dailyReminderTitle]);

  return null;
}

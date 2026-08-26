import type { NotificationChannelConfig, NotificationSettings } from "./types";

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  bloodRequestBroadcast: {
    enabled: true,
    locked: true,
    intervalDays: 1,
    hourBd: 10,
    notes:
      "When someone posts a blood need, every registered donor gets a notification.",
  },
  dailyDonationReminder: {
    enabled: true,
    locked: false,
    intervalDays: 1,
    hourBd: 10,
    notes:
      "Morning reminder for account holders to update last donation date after giving blood.",
  },
  contactChangeAlerts: {
    enabled: true,
    locked: false,
    intervalDays: 1,
    hourBd: 10,
    notes: "Notify the donor when admin approves or declines a contact change.",
  },
  systemAnnouncements: {
    enabled: true,
    locked: false,
    intervalDays: 1,
    hourBd: 10,
    notes: "Allow admin to send one-shot announcements to all account holders.",
  },
};

function clampInt(value: unknown, min: number, max: number, fallback: number) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function normalizeChannel(
  raw: Partial<NotificationChannelConfig> | null | undefined,
  fallback: NotificationChannelConfig,
): NotificationChannelConfig {
  return {
    enabled: raw?.enabled === undefined ? fallback.enabled : Boolean(raw.enabled),
    locked: Boolean(fallback.locked),
    intervalDays: clampInt(raw?.intervalDays, 1, 30, fallback.intervalDays),
    hourBd: clampInt(raw?.hourBd, 0, 23, fallback.hourBd),
    notes: String(raw?.notes ?? fallback.notes).trim().slice(0, 500),
  };
}

export function defaultNotificationSettings(): NotificationSettings {
  return {
    bloodRequestBroadcast: { ...DEFAULT_NOTIFICATION_SETTINGS.bloodRequestBroadcast },
    dailyDonationReminder: { ...DEFAULT_NOTIFICATION_SETTINGS.dailyDonationReminder },
    contactChangeAlerts: { ...DEFAULT_NOTIFICATION_SETTINGS.contactChangeAlerts },
    systemAnnouncements: { ...DEFAULT_NOTIFICATION_SETTINGS.systemAnnouncements },
  };
}

export function normalizeNotificationSettings(
  raw?: Partial<NotificationSettings> | null,
): NotificationSettings {
  const base = defaultNotificationSettings();
  const blood = normalizeChannel(raw?.bloodRequestBroadcast, base.bloodRequestBroadcast);
  // Blood-need broadcast stays on by default and remains the special always-run channel.
  if (blood.locked) blood.enabled = true;
  return {
    bloodRequestBroadcast: blood,
    dailyDonationReminder: normalizeChannel(
      raw?.dailyDonationReminder,
      base.dailyDonationReminder,
    ),
    contactChangeAlerts: normalizeChannel(
      raw?.contactChangeAlerts,
      base.contactChangeAlerts,
    ),
    systemAnnouncements: normalizeChannel(
      raw?.systemAnnouncements,
      base.systemAnnouncements,
    ),
  };
}

export function bangladeshDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

export function bangladeshHour(date = new Date()) {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    hour: "numeric",
    hour12: false,
  }).format(date);
  return Number(hour);
}

/** Calendar-day difference between two YYYY-MM-DD keys (Asia/Dhaka dates). */
export function daysBetweenDateKeys(fromKey: string, toKey: string) {
  const from = Date.parse(`${fromKey}T00:00:00+06:00`);
  const to = Date.parse(`${toKey}T00:00:00+06:00`);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return Number.POSITIVE_INFINITY;
  return Math.floor((to - from) / (24 * 60 * 60 * 1000));
}

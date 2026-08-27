import { isBloodlinkMode } from "@/lib/app-mode";

const TICK_MS = 5 * 60 * 1000; // every 5 minutes
let started = false;

/**
 * On the always-on BloodLink Railway web service, periodically create the
 * daily donation reminders (and monthly gold blessing) after the configured
 * Bangladesh hour — so we do not depend on an external Railway Cron Job.
 */
export function startBloodlinkNotificationScheduler() {
  if (started) return;
  if (!isBloodlinkMode()) return;
  if (typeof setInterval !== "function") return;
  started = true;

  const run = () => {
    void Promise.all([
      import("@/lib/db").then((m) => m.createDailyRemindersIfNeeded()),
      import("@/lib/db").then((m) => m.createMonthlyGoldBlessingIfNeeded()),
    ])
      .then(([created, gold]) => {
        if (created > 0 || gold.created) {
          console.info(
            `[bloodlink-cron] daily=${created} gold=${gold.created ? gold.donorId : "skip"}`,
          );
        }
      })
      .catch((err) => {
        console.error("[bloodlink-cron] failed", err);
      });
  };

  // First tick shortly after boot (lets DB URL / volume settle).
  setTimeout(run, 20_000);
  setInterval(run, TICK_MS);
  console.info("[bloodlink-cron] scheduler started (every 5 min, BD hour gate)");
}

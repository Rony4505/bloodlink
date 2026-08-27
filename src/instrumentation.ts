export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;

  const { isBloodlinkMode } = await import("@/lib/app-mode");
  if (!isBloodlinkMode()) return;

  const { startBloodlinkNotificationScheduler } = await import(
    "@/lib/notification-cron"
  );
  startBloodlinkNotificationScheduler();
}

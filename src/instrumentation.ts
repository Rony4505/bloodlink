export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;

  const { startBloodlinkNotificationScheduler } = await import(
    "@/lib/notification-cron"
  );
  startBloodlinkNotificationScheduler();
}

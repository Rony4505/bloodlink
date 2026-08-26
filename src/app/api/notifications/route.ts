import { NextResponse } from "next/server";
import { getCurrentDonor } from "@/lib/auth";
import {
  createDailyRemindersIfNeeded,
  createMonthlyGoldBlessingIfNeeded,
  getAdminSettings,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/db";
import {
  bangladeshDateKey,
  bangladeshHour,
  normalizeNotificationSettings,
} from "@/lib/notification-settings";

export async function GET() {
  const donor = await getCurrentDonor();
  if (!donor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await getAdminSettings();
  const notificationSettings = normalizeNotificationSettings(
    admin.notificationSettings,
  );
  const daily = notificationSettings.dailyDonationReminder;
  const gold = notificationSettings.monthlyGoldBlessing;

  if (daily.enabled && bangladeshHour() >= daily.hourBd) {
    await createDailyRemindersIfNeeded(bangladeshDateKey());
  }
  if (gold.enabled && bangladeshHour() >= gold.hourBd) {
    await createMonthlyGoldBlessingIfNeeded(bangladeshDateKey().slice(0, 7));
  }

  const notifications = await listNotifications(donor.id);
  return NextResponse.json({
    notifications,
    unread: notifications.filter((n) => !n.read).length,
    prefs: {
      dailyDonationReminder: {
        enabled: daily.enabled,
        hourBd: daily.hourBd,
        intervalDays: daily.intervalDays,
      },
      bloodRequestBroadcast: {
        enabled: notificationSettings.bloodRequestBroadcast.enabled,
      },
      monthlyGoldBlessing: {
        enabled: gold.enabled,
        hourBd: gold.hourBd,
      },
    },
  });
}

export async function PATCH(request: Request) {
  const donor = await getCurrentDonor();
  if (!donor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  if (body.all) {
    await markAllNotificationsRead(donor.id);
    return NextResponse.json({ ok: true });
  }

  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const ok = await markNotificationRead(donor.id, body.id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

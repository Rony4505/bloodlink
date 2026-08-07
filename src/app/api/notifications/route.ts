import { NextResponse } from "next/server";
import { getCurrentDonor } from "@/lib/auth";
import {
  createDailyRemindersIfNeeded,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/db";

function bangladeshDateKey(date = new Date()) {
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

function bangladeshHour(date = new Date()) {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    hour: "numeric",
    hour12: false,
  }).format(date);
  return Number(hour);
}

export async function GET() {
  const donor = await getCurrentDonor();
  if (!donor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Create daily 10:00 BD reminders when any logged-in user checks after 10:00
  if (bangladeshHour() >= 10) {
    await createDailyRemindersIfNeeded(bangladeshDateKey());
  }

  const notifications = await listNotifications(donor.id);
  return NextResponse.json({
    notifications,
    unread: notifications.filter((n) => !n.read).length,
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

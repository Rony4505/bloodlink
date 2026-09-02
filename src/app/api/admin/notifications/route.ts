import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  listAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "@/lib/db";

export async function GET() {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await listAdminNotifications();
  const unread = items.filter((n) => !n.read).length;
  return NextResponse.json({ items, unread });
}

export async function POST(request: Request) {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const action = String(body.action || "read");

    if (action === "read-all") {
      await markAllAdminNotificationsRead();
      return NextResponse.json({ ok: true });
    }

    const id = String(body.id || "").trim();
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const updated = await markAdminNotificationRead(id);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

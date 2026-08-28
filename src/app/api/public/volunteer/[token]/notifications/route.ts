import { NextResponse } from "next/server";
import {
  findVolunteerByLinkToken,
  listVolunteerNotifications,
  markAllVolunteerNotificationsRead,
  markVolunteerNotificationRead,
} from "@/lib/db";

type RouteParams = { params: Promise<{ token: string }> };

async function resolveVolunteer(token: string) {
  const volunteer = await findVolunteerByLinkToken(token);
  if (!volunteer || !volunteer.enabled) return null;
  return volunteer;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { token } = await params;
  const volunteer = await resolveVolunteer(token);
  if (!volunteer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const notifications = await listVolunteerNotifications(volunteer.id);
  return NextResponse.json({
    notifications,
    unread: notifications.filter((n) => !n.read).length,
  });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { token } = await params;
  const volunteer = await resolveVolunteer(token);
  if (!volunteer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  if (body.all) {
    await markAllVolunteerNotificationsRead(volunteer.id);
    return NextResponse.json({ ok: true });
  }

  const id = String(body?.id || "").trim();
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const ok = await markVolunteerNotificationRead(volunteer.id, id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

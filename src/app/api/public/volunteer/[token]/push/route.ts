import { NextResponse } from "next/server";
import {
  findVolunteerByLinkToken,
  upsertPushSubscription,
} from "@/lib/db";
import { volunteerPushUserId } from "@/lib/volunteer-urls";

type RouteParams = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const { token } = await params;
  const volunteer = await findVolunteerByLinkToken(token);
  if (!volunteer || !volunteer.enabled) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const endpoint = String(body?.endpoint || "").trim();
    const p256dh = String(body?.keys?.p256dh || body?.p256dh || "").trim();
    const auth = String(body?.keys?.auth || body?.auth || "").trim();
    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    await upsertPushSubscription({
      userId: volunteerPushUserId(volunteer.id),
      endpoint,
      p256dh,
      auth,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

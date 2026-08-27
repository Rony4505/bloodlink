import { NextResponse } from "next/server";
import { getCurrentDonor } from "@/lib/auth";
import {
  removePushSubscriptionForUser,
  upsertPushSubscription,
  donorHasPushSubscription,
} from "@/lib/db";
import { getPublicVapidKey } from "@/lib/web-push-send";

export const dynamic = "force-dynamic";

export async function GET() {
  const donor = await getCurrentDonor();
  if (!donor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const publicKey = await getPublicVapidKey();
    const subscribed = await donorHasPushSubscription(donor.id);
    return NextResponse.json({ publicKey, subscribed });
  } catch {
    return NextResponse.json({ error: "Push unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const donor = await getCurrentDonor();
  if (!donor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const endpoint = String(body.endpoint || "").trim();
    const p256dh = String(body.keys?.p256dh || body.p256dh || "").trim();
    const auth = String(body.keys?.auth || body.auth || "").trim();
    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    await upsertPushSubscription({
      userId: donor.id,
      endpoint,
      p256dh,
      auth,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const donor = await getCurrentDonor();
  if (!donor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const endpoint = String(body.endpoint || "").trim() || undefined;
    await removePushSubscriptionForUser(donor.id, endpoint);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getCurrentDonor } from "@/lib/auth";
import {
  removePushSubscriptionForUser,
  upsertPushSubscription,
  donorPushSubscriptionKind,
} from "@/lib/db";
import { getPublicVapidKey } from "@/lib/web-push-send";
import { LOCAL_PUSH_PERMISSION_PREFIX } from "@/lib/push-subscription-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const donor = await getCurrentDonor();
  if (!donor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Always return subscription status even if VAPID key generation fails,
  // so the client can still show the allow prompt.
  const kind = await donorPushSubscriptionKind(donor.id);
  let publicKey: string | null = null;
  try {
    publicKey = await getPublicVapidKey();
  } catch {
    /* optional for status check */
  }
  return NextResponse.json({
    publicKey,
    subscribed: kind !== "none",
    realPush: kind === "real",
    permissionOnly: kind === "permission-only",
    kind,
  });
}

export async function POST(request: Request) {
  const donor = await getCurrentDonor();
  if (!donor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // iPhone Safari/Chrome (and other partial browsers): user allowed notifications
    // in the browser prompt, but PushManager/subscription may be unavailable.
    if (body.permissionOnly === true) {
      await upsertPushSubscription({
        userId: donor.id,
        endpoint: `${LOCAL_PUSH_PERMISSION_PREFIX}${donor.id}`,
        p256dh: "permission",
        auth: "permission",
      });
      return NextResponse.json({ ok: true, permissionOnly: true });
    }

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

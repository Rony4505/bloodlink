import { NextResponse } from "next/server";
import { getCurrentDonor } from "@/lib/auth";
import {
  removePushSubscriptionForUser,
  removeGuestPushSubscriptionsByEndpoint,
  upsertPushSubscription,
  donorHasDeliverablePushSubscription,
  donorHasPermissionOnlyPush,
  finalizeReferralAfterPush,
} from "@/lib/db";
import { getGuestPushUserId, getOrCreateGuestPushUserId } from "@/lib/guest-push";
import { LOCAL_PUSH_PERMISSION_PREFIX } from "@/lib/push-subscription";
import { getPublicVapidKey } from "@/lib/web-push-send";

export const dynamic = "force-dynamic";

/**
 * Push identity for this browser: the logged-in donor, otherwise a cookie
 * based guest id. Allow therefore works for every visitor, logged in or not.
 */
async function resolvePushUser(create: boolean): Promise<{
  userId: string | null;
  donorId: string | null;
}> {
  const donor = await getCurrentDonor();
  if (donor) return { userId: donor.id, donorId: donor.id };
  const guest = create
    ? await getOrCreateGuestPushUserId()
    : await getGuestPushUserId();
  return { userId: guest, donorId: null };
}

export async function GET() {
  const { userId, donorId } = await resolvePushUser(false);
  const subscribed = userId
    ? await donorHasDeliverablePushSubscription(userId)
    : false;
  const permissionOnly = userId ? await donorHasPermissionOnlyPush(userId) : false;
  // Always return subscription status even if VAPID key generation fails,
  // so the client can still show the allow prompt.
  let publicKey: string | null = null;
  try {
    publicKey = await getPublicVapidKey();
  } catch {
    /* optional for status check */
  }
  return NextResponse.json({
    publicKey,
    subscribed,
    permissionOnly,
    guest: !donorId,
  });
}

export async function POST(request: Request) {
  const { userId, donorId } = await resolvePushUser(true);
  if (!userId) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  try {
    const body = await request.json();

    // iPhone Safari/Chrome tabs only — Android/desktop must send a real PushSubscription.
    if (body.permissionOnly === true) {
      const ua = request.headers.get("user-agent") || "";
      const android = /Android/i.test(ua);
      const ios =
        /iPhone|iPad|iPod/i.test(ua) && !/Android/i.test(ua);
      if (android || (!ios && /Chrome|Chromium|Firefox|Edg\//i.test(ua))) {
        return NextResponse.json(
          {
            error: "Full Web Push subscription required on this device",
            code: "FULL_PUSH_REQUIRED",
          },
          { status: 400 },
        );
      }
      await upsertPushSubscription({
        userId,
        endpoint: `${LOCAL_PUSH_PERMISSION_PREFIX}${userId}`,
        p256dh: "permission",
        auth: "permission",
      });
      if (donorId) {
        void finalizeReferralAfterPush(donorId).catch((err) => {
          console.error("[bloodlink] finalize referral after push failed:", err);
        });
      }
      return NextResponse.json({ ok: true, permissionOnly: true, guest: !donorId });
    }

    const endpoint = String(body.endpoint || "").trim();
    const p256dh = String(body.keys?.p256dh || body.p256dh || "").trim();
    const auth = String(body.keys?.auth || body.auth || "").trim();
    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    await upsertPushSubscription({ userId, endpoint, p256dh, auth });
    await removePushSubscriptionForUser(
      userId,
      `${LOCAL_PUSH_PERMISSION_PREFIX}${userId}`,
    );

    if (donorId) {
      // Same device allowed earlier as a guest → now owned by the donor.
      await removeGuestPushSubscriptionsByEndpoint(endpoint);
      void finalizeReferralAfterPush(donorId).catch((err) => {
        console.error("[bloodlink] finalize referral after push failed:", err);
      });
    }
    return NextResponse.json({ ok: true, guest: !donorId });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { userId } = await resolvePushUser(false);
  if (!userId) return NextResponse.json({ ok: true });
  try {
    const body = await request.json().catch(() => ({}));
    const endpoint = String(body.endpoint || "").trim() || undefined;
    await removePushSubscriptionForUser(userId, endpoint);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

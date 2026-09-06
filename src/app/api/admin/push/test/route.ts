import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { ADMIN_NOTIFY_USER_ID } from "@/lib/admin-notify-user";
import {
  adminHasDeliverablePush,
  listAllDeliverablePushUserIds,
} from "@/lib/db";
import {
  sendWebPushToUsers,
  sendWebPushToAllDeliverable,
} from "@/lib/web-push-send";
import { BLOODLINK_OWNER_PATH } from "@/lib/bloodlink-admin-path";

export const dynamic = "force-dynamic";

/**
 * Admin test / rebuild push helpers:
 * - default: test push to admin only
 * - body.broadcast=true: ping every deliverable device (donors + admin + volunteers)
 */
export async function POST(request: Request) {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const broadcast = Boolean(body?.broadcast);

    if (broadcast) {
      const result = await sendWebPushToAllDeliverable({
        title: "BloodLink",
        body: "নতুন push সিস্টেম চালু — আপনি এখন নোটিফিকেশন পাবেন।",
        url: "/notifications",
        tag: `push-rebuild-${Date.now()}`,
      });
      const users = await listAllDeliverablePushUserIds();
      return NextResponse.json({
        ok: true,
        broadcast: true,
        sent: result.sent,
        failed: result.failed,
        userCount: users.length,
      });
    }

    const subscribed = await adminHasDeliverablePush();
    if (!subscribed) {
      return NextResponse.json(
        {
          error:
            "Admin push is not saved on this device yet. Tap Allow admin push first.",
        },
        { status: 400 },
      );
    }

    const result = await sendWebPushToUsers([ADMIN_NOTIFY_USER_ID], {
      title: "BloodLink Admin",
      body: "টেস্ট push সফল — অ্যাডমিন নোটিফিকেশন কাজ করছে।",
      url: BLOODLINK_OWNER_PATH,
      tag: `admin-test-${Date.now()}`,
    });

    return NextResponse.json({
      ok: true,
      broadcast: false,
      sent: result.sent,
      failed: result.failed,
    });
  } catch (err) {
    console.error("[bloodlink-push] admin test failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

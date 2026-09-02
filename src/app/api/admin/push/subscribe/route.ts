import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  adminHasDeliverablePush,
  upsertAdminPushSubscription,
} from "@/lib/db";
import { getPublicVapidKey } from "@/lib/web-push-send";

export const dynamic = "force-dynamic";

export async function GET() {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscribed = await adminHasDeliverablePush();
  let publicKey: string | null = null;
  try {
    publicKey = await getPublicVapidKey();
  } catch {
    /* optional */
  }
  return NextResponse.json({ publicKey, subscribed });
}

export async function POST(request: Request) {
  const ok = await isAdminAuthenticated();
  if (!ok) {
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

    await upsertAdminPushSubscription({ endpoint, p256dh, auth });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

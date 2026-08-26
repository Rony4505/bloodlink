import { NextResponse } from "next/server";
import { createDailyRemindersIfNeeded } from "@/lib/db";
import { bangladeshDateKey } from "@/lib/notification-settings";

/**
 * External scheduler (Railway cron / curl) can hit this after the configured
 * BD hour to ensure daily donation reminders are created even if no user
 * opens the app. Protect with CRON_SECRET when set.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const auth = request.headers.get("authorization") || "";
    const token = auth.replace(/^Bearer\s+/i, "").trim();
    const urlToken = new URL(request.url).searchParams.get("secret") || "";
    if (token !== secret && urlToken !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const created = await createDailyRemindersIfNeeded(bangladeshDateKey());
  return NextResponse.json({
    ok: true,
    dateKey: bangladeshDateKey(),
    created,
  });
}

export async function POST(request: Request) {
  return GET(request);
}

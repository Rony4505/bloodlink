import { NextResponse } from "next/server";
import {
  createDailyRemindersIfNeeded,
  createMonthlyGoldBlessingIfNeeded,
} from "@/lib/db";
import { bangladeshDateKey } from "@/lib/notification-settings";

/**
 * External scheduler (Railway cron / curl) can hit this after the configured
 * BD hour. Protect with CRON_SECRET when set.
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

  const dateKey = bangladeshDateKey();
  const created = await createDailyRemindersIfNeeded(dateKey);
  const gold = await createMonthlyGoldBlessingIfNeeded(dateKey.slice(0, 7));
  return NextResponse.json({
    ok: true,
    dateKey,
    created,
    goldBlessing: gold,
  });
}

export async function POST(request: Request) {
  return GET(request);
}

import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  getVisitorAnalytics,
  type VisitorAnalyticsPeriod,
} from "@/lib/visitor-analytics";

function parsePeriod(raw: string | null): VisitorAnalyticsPeriod {
  if (raw === "7d" || raw === "30d" || raw === "today") return raw;
  return "today";
}

export async function GET(request: Request) {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = parsePeriod(searchParams.get("period"));
  const analytics = await getVisitorAnalytics(period);

  return NextResponse.json({ analytics });
}

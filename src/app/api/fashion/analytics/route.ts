import { NextResponse } from "next/server";
import { isFashionAdminAuthenticated } from "@/lib/fashion/customer-auth";
import { getAnalytics } from "@/lib/fashion/store";

export async function GET(request: Request) {
  if (!(await isFashionAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") === "monthly" ? "monthly" : "daily";
  const analytics = await getAnalytics(period);
  return NextResponse.json({ analytics });
}

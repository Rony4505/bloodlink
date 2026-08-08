import { NextResponse } from "next/server";
import { getAdminSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdminSettings();
  const banners = (admin.banners || []).filter((b) => b.enabled);
  return NextResponse.json({ banners });
}

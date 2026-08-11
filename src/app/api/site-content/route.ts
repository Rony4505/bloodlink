import { NextResponse } from "next/server";
import { getAdminSettings } from "@/lib/db";
import { normalizeSiteAppearance } from "@/lib/site-cms";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdminSettings();
  return NextResponse.json({
    siteAppearance: normalizeSiteAppearance(admin.siteAppearance),
  });
}

import { NextResponse } from "next/server";
import { getAdminSettings } from "@/lib/db";
import { normalizeSiteAppearance } from "@/lib/site-cms";

export const revalidate = 30;

export async function GET() {
  const admin = await getAdminSettings();
  return NextResponse.json(
    {
      siteAppearance: normalizeSiteAppearance(admin.siteAppearance),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    },
  );
}

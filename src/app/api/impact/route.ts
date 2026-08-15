import { NextResponse } from "next/server";
import { getAdminSettings, getSiteImpactStats } from "@/lib/db";

export async function GET() {
  try {
    const [stats, admin] = await Promise.all([
      getSiteImpactStats(),
      getAdminSettings(),
    ]);
    const stories = (admin.siteAppearance?.successStories || []).filter(
      (s) => s.enabled,
    );
    return NextResponse.json({
      stats: {
        livesHelped: stats.livesHelped,
        registeredUsers: stats.registeredUsers,
        activeRequests: stats.activeRequests,
        citiesCovered: stats.citiesCovered,
        verifiedDonors: stats.verifiedDonors,
        availableDonors: stats.availableDonors,
      },
      stories: stories.map((s) => ({
        id: s.id,
        name: s.name,
        handle: s.handle,
        quoteEn: s.quoteEn,
        quoteBn: s.quoteBn,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

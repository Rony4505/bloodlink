import { NextResponse } from "next/server";
import { listDonors } from "@/lib/db";
import { BLOOD_GROUPS } from "@/lib/districts";
import { isDonorAvailable } from "@/lib/availability";

export const revalidate = 15;

export async function GET() {
  const donors = await listDonors();
  const byGroup = BLOOD_GROUPS.map((bloodGroup) => {
    const groupDonors = donors.filter((d) => d.bloodGroup === bloodGroup);
    let available = 0;
    let unavailable = 0;
    for (const d of groupDonors) {
      const ok = isDonorAvailable(d.gender, d.lastDonationDate);
      if (ok) available += 1;
      else unavailable += 1;
    }
    return {
      bloodGroup,
      available,
      unavailable,
      total: groupDonors.length,
    };
  });

  const totalAvailable = byGroup.reduce((sum, g) => sum + g.available, 0);
  const totalUnavailable = byGroup.reduce((sum, g) => sum + g.unavailable, 0);

  return NextResponse.json(
    {
      totalAvailable,
      totalUnavailable,
      total: donors.length,
      byGroup,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60",
      },
    },
  );
}

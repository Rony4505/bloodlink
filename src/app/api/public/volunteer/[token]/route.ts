import { NextResponse } from "next/server";
import {
  findVolunteerByLinkToken,
  listVolunteerDonorSummaries,
} from "@/lib/db";
import { formatVolunteerDateTime } from "@/lib/volunteer-urls";
import { getPublicVapidKey } from "@/lib/web-push-send";

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  const { token } = await params;
  const volunteer = await findVolunteerByLinkToken(token);
  if (!volunteer || !volunteer.enabled) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date")?.slice(0, 10) || "";

  const all = await listVolunteerDonorSummaries(volunteer.id);
  const filtered = date
    ? all.filter((d) => d.createdAt.slice(0, 10) === date)
    : all;
  const approved = all.filter((d) => d.volunteerApproved);
  const approvedFiltered = date
    ? approved.filter((d) => d.createdAt.slice(0, 10) === date)
    : approved;
  const pendingManual = all.filter(
    (d) => d.volunteerSource === "manual" && !d.volunteerApproved,
  );

  const dayCounts: Record<string, number> = {};
  for (const d of approved) {
    const day = d.createdAt.slice(0, 10);
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  }

  let publicKey: string | null = null;
  try {
    publicKey = await getPublicVapidKey();
  } catch {
    publicKey = null;
  }

  return NextResponse.json({
    volunteer: {
      id: volunteer.id,
      name: volunteer.name,
      district: volunteer.district,
      role: volunteer.role,
      notificationsEnabled: volunteer.notificationsEnabled,
    },
    stats: {
      totalListed: all.length,
      totalApproved: approved.length,
      pendingManual: pendingManual.length,
      filteredCount: approvedFiltered.length,
      date: date || null,
    },
    dayCounts,
    donors: filtered.map((d) => ({
      ...d,
      addedLabel: formatVolunteerDateTime(d.createdAt),
    })),
    publicKey,
  });
}

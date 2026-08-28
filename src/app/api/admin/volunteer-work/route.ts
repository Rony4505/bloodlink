import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  findVolunteerById,
  listVolunteerActivities,
  listVolunteerDonorSummaries,
} from "@/lib/db";
import { formatVolunteerDateTime } from "@/lib/volunteer-urls";

export async function GET(request: Request) {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const volunteerId = String(searchParams.get("volunteerId") || "").trim();
  const date = searchParams.get("date")?.slice(0, 10) || "";

  if (!volunteerId) {
    return NextResponse.json({ error: "volunteerId required" }, { status: 400 });
  }

  const volunteer = await findVolunteerById(volunteerId);
  if (!volunteer) {
    return NextResponse.json({ error: "Volunteer not found" }, { status: 404 });
  }

  const all = await listVolunteerDonorSummaries(volunteer.id);
  const approved = all.filter((d) => d.volunteerApproved);
  const filtered = date
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

  const activities = await listVolunteerActivities(volunteer.id);

  return NextResponse.json({
    volunteer: {
      id: volunteer.id,
      name: volunteer.name,
      role: volunteer.role,
      district: volunteer.district,
      linkToken: volunteer.linkToken,
      notificationsEnabled: volunteer.notificationsEnabled,
      enabled: volunteer.enabled,
    },
    stats: {
      totalListed: all.length,
      totalApproved: approved.length,
      pendingManual: pendingManual.length,
      filteredCount: filtered.length,
      activityCount: activities.length,
      date: date || null,
    },
    dayCounts,
    donors: filtered.map((d) => ({
      ...d,
      addedLabel: formatVolunteerDateTime(d.createdAt),
    })),
    activities,
  });
}

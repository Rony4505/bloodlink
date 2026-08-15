import { NextResponse } from "next/server";
import { getCurrentVolunteer, toSafeVolunteer } from "@/lib/auth";
import { listVolunteerActivities } from "@/lib/db";

export async function GET() {
  const volunteer = await getCurrentVolunteer();
  if (!volunteer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activities = await listVolunteerActivities(volunteer.id);
  return NextResponse.json({
    volunteer: toSafeVolunteer(volunteer),
    activities,
  });
}

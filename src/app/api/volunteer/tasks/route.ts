import { NextResponse } from "next/server";
import { getCurrentVolunteer } from "@/lib/auth";
import {
  findVolunteerById,
  listVolunteerActivities,
  updateVolunteerActivity,
} from "@/lib/db";
import { volunteerTaskUpdateSchema } from "@/lib/validations";

export async function GET() {
  const volunteer = await getCurrentVolunteer();
  if (!volunteer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const activities = await listVolunteerActivities(volunteer.id);
  return NextResponse.json({ activities });
}

/** Volunteer can only update status + their own progress note on assigned tasks. */
export async function PATCH(request: Request) {
  try {
    const volunteer = await getCurrentVolunteer();
    if (!volunteer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = volunteerTaskUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid update" }, { status: 400 });
    }

    const activities = await listVolunteerActivities(volunteer.id);
    const mine = activities.find((a) => a.id === parsed.data.id);
    if (!mine) {
      return NextResponse.json(
        { error: "Task not found or not assigned to you" },
        { status: 404 },
      );
    }

    // Re-check volunteer still exists/enabled
    const still = await findVolunteerById(volunteer.id);
    if (!still?.enabled) {
      return NextResponse.json({ error: "Account disabled" }, { status: 403 });
    }

    const updated = await updateVolunteerActivity(parsed.data.id, {
      status: parsed.data.status,
      volunteerNote: parsed.data.volunteerNote,
    });

    return NextResponse.json({ ok: true, activity: updated });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

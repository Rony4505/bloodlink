import { NextResponse } from "next/server";
import { hashPassword, isAdminAuthenticated } from "@/lib/auth";
import {
  createVolunteer,
  createVolunteerActivity,
  deleteVolunteer,
  deleteVolunteerActivity,
  listVolunteerActivities,
  listVolunteers,
  toPublicVolunteer,
  updateVolunteer,
  updateVolunteerActivity,
} from "@/lib/db";
import { normalizePhone } from "@/lib/privacy";
import {
  volunteerActivitySchema,
  volunteerSchema,
} from "@/lib/validations";

export async function GET() {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [volunteers, activities] = await Promise.all([
    listVolunteers(),
    listVolunteerActivities(),
  ]);

  const withWork = volunteers.map((v) => {
    const mine = activities.filter((a) => a.volunteerId === v.id);
    return {
      ...toPublicVolunteer(v),
      activityCount: mine.length,
      doneCount: mine.filter((a) => a.status === "done").length,
      inProgressCount: mine.filter((a) => a.status === "in_progress").length,
      activities: mine,
    };
  });

  return NextResponse.json({
    volunteers: withWork,
    stats: {
      total: volunteers.length,
      active: volunteers.filter((v) => v.enabled).length,
      activities: activities.length,
    },
  });
}

export async function POST(request: Request) {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const kind = String(body?.kind || "volunteer");

    if (kind === "activity") {
      const parsed = volunteerActivitySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid activity", details: parsed.error.flatten() },
          { status: 400 },
        );
      }
      const activity = await createVolunteerActivity({
        ...parsed.data,
        volunteerNote: "",
      });
      return NextResponse.json({ ok: true, activity });
    }

    const parsed = volunteerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid volunteer", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const passwordHash = await hashPassword(parsed.data.password);
    const volunteer = await createVolunteer({
      name: parsed.data.name,
      phone: parsed.data.phone ? normalizePhone(parsed.data.phone) : "",
      email: parsed.data.email || "",
      district: parsed.data.district || "",
      role: parsed.data.role,
      notes: parsed.data.notes || "",
      username: parsed.data.username.trim().toLowerCase(),
      passwordHash,
      enabled: parsed.data.enabled !== false,
    });
    return NextResponse.json({
      ok: true,
      volunteer: toPublicVolunteer(volunteer),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    const status = message.includes("taken") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const kind = String(body?.kind || "volunteer");

    if (kind === "activity") {
      const id = String(body?.id || "");
      if (!id) {
        return NextResponse.json({ error: "Missing activity id" }, { status: 400 });
      }
      const activity = await updateVolunteerActivity(id, {
        title: body.title,
        description: body.description,
        activityType: body.activityType,
        status: body.status,
        activityDate: body.activityDate,
        volunteerNote: body.volunteerNote,
      });
      if (!activity) {
        return NextResponse.json({ error: "Activity not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, activity });
    }

    const id = String(body?.id || "");
    if (!id) {
      return NextResponse.json({ error: "Missing volunteer id" }, { status: 400 });
    }

    const patch: Parameters<typeof updateVolunteer>[1] = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.phone !== undefined) {
      patch.phone = body.phone ? normalizePhone(String(body.phone)) : "";
    }
    if (body.email !== undefined) patch.email = body.email;
    if (body.district !== undefined) patch.district = body.district;
    if (body.role !== undefined) patch.role = body.role;
    if (body.notes !== undefined) patch.notes = body.notes;
    if (body.enabled !== undefined) patch.enabled = Boolean(body.enabled);
    if (body.username) patch.username = String(body.username).trim().toLowerCase();
    if (body.password && String(body.password).length >= 6) {
      patch.passwordHash = await hashPassword(String(body.password));
    }

    const volunteer = await updateVolunteer(id, patch);
    if (!volunteer) {
      return NextResponse.json({ error: "Volunteer not found" }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      volunteer: toPublicVolunteer(volunteer),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    const status = message.includes("taken") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") || "volunteer";
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  if (kind === "activity") {
    const deleted = await deleteVolunteerActivity(id);
    if (!deleted) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  const deleted = await deleteVolunteer(id);
  if (!deleted) {
    return NextResponse.json({ error: "Volunteer not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

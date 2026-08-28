import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { hashPassword, isAdminAuthenticated } from "@/lib/auth";
import {
  createVolunteer,
  createVolunteerActivity,
  createVolunteerNotification,
  deleteVolunteer,
  deleteVolunteerActivity,
  findVolunteerById,
  listDonorsByVolunteer,
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
import { sendWebPushToUsers } from "@/lib/web-push-send";
import { volunteerPushUserId, volunteerWorkUrl } from "@/lib/volunteer-urls";

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

  const donorStats = await Promise.all(
    volunteers.map(async (v) => {
      const donors = await listDonorsByVolunteer(v.id);
      return {
        volunteerId: v.id,
        totalDonors: donors.length,
        approvedDonors: donors.filter((d) => d.volunteerApproved).length,
        pendingManual: donors.filter(
          (d) => d.volunteerSource === "manual" && !d.volunteerApproved,
        ).length,
        linkDonors: donors.filter((d) => d.volunteerSource === "link").length,
      };
    }),
  );

  return NextResponse.json({
    volunteers: withWork,
    donorStats,
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

    if (kind === "notify") {
      const volunteerId = String(body?.volunteerId || "").trim();
      const title = String(body?.title || "").trim();
      const message = String(body?.body || body?.message || "").trim();
      if (!volunteerId || !title || !message) {
        return NextResponse.json(
          { error: "volunteerId, title, and body required" },
          { status: 400 },
        );
      }

      const broadcast = volunteerId === "all";
      const targets = broadcast
        ? (await listVolunteers()).filter((v) => v.enabled && v.notificationsEnabled)
        : [await findVolunteerById(volunteerId)].filter(Boolean);

      if (!targets.length) {
        return NextResponse.json(
          { error: broadcast ? "No eligible volunteers" : "Volunteer not found" },
          { status: broadcast ? 400 : 404 },
        );
      }

      const userIds: string[] = [];
      let stored = 0;
      for (const volunteer of targets) {
        if (!volunteer) continue;
        const workUrl = volunteerWorkUrl(volunteer.linkToken);
        await createVolunteerNotification({
          volunteerId: volunteer.id,
          title,
          body: message,
          href: workUrl,
        });
        stored += 1;
        userIds.push(volunteerPushUserId(volunteer.id));
      }

      const push = await sendWebPushToUsers(userIds, {
        title,
        body: message,
        url: targets[0] ? volunteerWorkUrl(targets[0]!.linkToken) : "/",
        tag: broadcast ? `volunteer-broadcast-${Date.now()}` : `volunteer-msg-${volunteerId}`,
      });

      return NextResponse.json({
        ok: true,
        push,
        stored,
        targetCount: targets.length,
        broadcast,
      });
    }

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
    const username =
      parsed.data.username?.trim().toLowerCase() ||
      `v-${randomUUID().slice(0, 8)}`;
    const passwordHash = parsed.data.password
      ? await hashPassword(parsed.data.password)
      : "";
    const volunteer = await createVolunteer({
      name: parsed.data.name,
      phone: parsed.data.phone ? normalizePhone(parsed.data.phone) : "",
      email: parsed.data.email || "",
      district: parsed.data.district || "",
      role: parsed.data.role,
      notes: parsed.data.notes || "",
      username,
      passwordHash,
      enabled: parsed.data.enabled !== false,
      linkToken: "",
      notificationsEnabled: true,
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
    if (body.notificationsEnabled !== undefined) {
      patch.notificationsEnabled = Boolean(body.notificationsEnabled);
    }
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

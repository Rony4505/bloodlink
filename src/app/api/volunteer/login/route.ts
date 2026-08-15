import { NextResponse } from "next/server";
import {
  createVolunteerSession,
  toSafeVolunteer,
  verifyPassword,
} from "@/lib/auth";
import { findVolunteerByUsername } from "@/lib/db";
import { volunteerLoginSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = volunteerLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid login" }, { status: 400 });
    }

    const volunteer = await findVolunteerByUsername(parsed.data.username);
    if (!volunteer || !volunteer.enabled || !volunteer.passwordHash) {
      return NextResponse.json(
        { error: "Wrong username or password" },
        { status: 401 },
      );
    }

    const ok = await verifyPassword(parsed.data.password, volunteer.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "Wrong username or password" },
        { status: 401 },
      );
    }

    await createVolunteerSession(volunteer.id);
    return NextResponse.json({
      ok: true,
      volunteer: toSafeVolunteer(volunteer),
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

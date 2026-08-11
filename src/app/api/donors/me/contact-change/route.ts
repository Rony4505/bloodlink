import { NextResponse } from "next/server";
import { getCurrentDonor } from "@/lib/auth";
import { OWNER_EMAIL, OWNER_PHONE } from "@/lib/defaults";
import {
  createContactChangeRequest,
  getAdminSettings,
  getPendingContactChange,
} from "@/lib/db";
import { normalizePhone } from "@/lib/privacy";
import { contactChangeSchema } from "@/lib/validations";

export async function GET() {
  const current = await getCurrentDonor();
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = await getAdminSettings();
  const pending = await getPendingContactChange(current.id);
  return NextResponse.json({
    pending,
    ownerEmail: admin.verifyEmail || OWNER_EMAIL,
    ownerPhone: admin.verifyPhone || OWNER_PHONE,
  });
}

export async function POST(request: Request) {
  try {
    const current = await getCurrentDonor();
    if (!current) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = contactChangeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Provide a new email and/or phone number" },
        { status: 400 },
      );
    }

    const requestedEmail =
      parsed.data.requestedEmail && parsed.data.requestedEmail.length > 0
        ? parsed.data.requestedEmail
        : null;
    const requestedPhone =
      parsed.data.requestedPhone && parsed.data.requestedPhone.length > 0
        ? normalizePhone(parsed.data.requestedPhone)
        : null;

    if (
      requestedEmail &&
      requestedEmail.toLowerCase() === current.email.toLowerCase() &&
      (!requestedPhone || requestedPhone === current.phone)
    ) {
      return NextResponse.json(
        { error: "New contact details must be different" },
        { status: 400 },
      );
    }

    try {
      const changeRequest = await createContactChangeRequest({
        donorId: current.id,
        currentEmail: current.email,
        currentPhone: current.phone,
        requestedEmail,
        requestedPhone,
        note: parsed.data.note || "",
      });
      const admin = await getAdminSettings();
      return NextResponse.json({
        ok: true,
        request: changeRequest,
        ownerEmail: admin.verifyEmail || OWNER_EMAIL,
        ownerPhone: admin.verifyPhone || OWNER_PHONE,
      });
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      if (code === "PENDING_EXISTS") {
        return NextResponse.json(
          { error: "You already have a pending change request" },
          { status: 409 },
        );
      }
      if (code === "EMAIL_TAKEN") {
        return NextResponse.json(
          { error: "That email is already used by another account" },
          { status: 409 },
        );
      }
      throw err;
    }
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getCurrentDonor } from "@/lib/auth";
import { OWNER_EMAIL, OWNER_PHONE } from "@/lib/defaults";
import {
  createContactChangeRequest,
  getPendingContactChange,
} from "@/lib/db";
import { normalizePhone } from "@/lib/privacy";
import { contactChangeSchema } from "@/lib/validations";

export async function GET() {
  const current = await getCurrentDonor();
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const pending = await getPendingContactChange(current.id);
  return NextResponse.json({
    pending,
    ownerEmail: OWNER_EMAIL,
    ownerPhone: OWNER_PHONE,
  });
}

export async function POST(request: Request) {
  try {
    const current = await getCurrentDonor();
    if (!current) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = contactChangeSchema.safeParse(body);
    if (!parsed.success) {
      const paths = new Set(parsed.error.issues.map((i) => String(i.path[0] ?? "")));
      if (paths.has("requestedEmail")) {
        return NextResponse.json(
          { code: "INVALID_EMAIL", error: "Enter a valid email address" },
          { status: 400 },
        );
      }
      if (paths.has("requestedPhone")) {
        return NextResponse.json(
          {
            code: "INVALID_PHONE",
            error: "Enter a valid Bangladesh mobile number (01XXXXXXXXX)",
          },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { code: "EMPTY", error: "Provide a new email and/or phone number" },
        { status: 400 },
      );
    }

    const requestedEmailRaw =
      parsed.data.requestedEmail && parsed.data.requestedEmail.length > 0
        ? parsed.data.requestedEmail.toLowerCase()
        : null;
    const requestedPhoneRaw =
      parsed.data.requestedPhone && parsed.data.requestedPhone.length > 0
        ? normalizePhone(parsed.data.requestedPhone)
        : null;

    // Ignore values that equal the donor's current details so only real changes are requested.
    const requestedEmail =
      requestedEmailRaw && requestedEmailRaw !== current.email.toLowerCase()
        ? requestedEmailRaw
        : null;
    const requestedPhone =
      requestedPhoneRaw && requestedPhoneRaw !== normalizePhone(current.phone)
        ? requestedPhoneRaw
        : null;

    if (!requestedEmail && !requestedPhone) {
      return NextResponse.json(
        { code: "SAME", error: "New contact details must be different" },
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
      return NextResponse.json({
        ok: true,
        request: changeRequest,
        ownerEmail: OWNER_EMAIL,
        ownerPhone: OWNER_PHONE,
      });
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      if (code === "PENDING_EXISTS") {
        return NextResponse.json(
          { code, error: "You already have a pending change request" },
          { status: 409 },
        );
      }
      if (code === "EMAIL_TAKEN") {
        return NextResponse.json(
          { code, error: "That email is already used by another account" },
          { status: 409 },
        );
      }
      if (code === "PHONE_TAKEN") {
        return NextResponse.json(
          { code, error: "That phone number is already used by another account" },
          { status: 409 },
        );
      }
      throw err;
    }
  } catch (err) {
    console.error("[bloodlink] contact-change request failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

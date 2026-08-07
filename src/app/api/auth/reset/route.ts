import { NextResponse } from "next/server";
import { hashCode, hashPassword } from "@/lib/auth";
import { findDonorByEmail, findDonorByPhone, updateDonor } from "@/lib/db";
import { normalizePhone } from "@/lib/privacy";
import { resetPasswordSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid reset data" }, { status: 400 });
    }

    const email = parsed.data.email?.trim().toLowerCase() || "";
    const phone = parsed.data.phone ? normalizePhone(parsed.data.phone) : "";
    const channel = email ? "email" : "phone";

    const donor = email
      ? await findDonorByEmail(email)
      : await findDonorByPhone(phone);

    if (!donor) {
      return NextResponse.json({ error: "Invalid reset code" }, { status: 400 });
    }

    if (
      !donor.pendingResetCodeHash ||
      !donor.pendingResetExpiresAt ||
      donor.pendingResetChannel !== channel
    ) {
      return NextResponse.json(
        { error: "No active reset request. Request a new code." },
        { status: 400 },
      );
    }

    if (new Date(donor.pendingResetExpiresAt).getTime() < Date.now()) {
      await updateDonor(donor.id, {
        pendingResetCodeHash: null,
        pendingResetChannel: null,
        pendingResetExpiresAt: null,
      });
      return NextResponse.json(
        { error: "Reset code expired. Request a new one." },
        { status: 400 },
      );
    }

    if (donor.pendingResetCodeHash !== hashCode(parsed.data.code)) {
      return NextResponse.json({ error: "Wrong reset code" }, { status: 400 });
    }

    if (channel === "email" && !donor.emailVerified) {
      return NextResponse.json(
        { error: "Gmail must be verified to reset password" },
        { status: 400 },
      );
    }
    if (channel === "phone" && !donor.phoneVerified) {
      return NextResponse.json(
        { error: "Phone must be verified to reset password" },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(parsed.data.newPassword);
    await updateDonor(donor.id, {
      passwordHash,
      pendingResetCodeHash: null,
      pendingResetChannel: null,
      pendingResetExpiresAt: null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

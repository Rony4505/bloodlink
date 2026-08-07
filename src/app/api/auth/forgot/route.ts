import { NextResponse } from "next/server";
import { hashCode, makeCode } from "@/lib/auth";
import { findDonorByEmail, findDonorByPhone, updateDonor } from "@/lib/db";
import { normalizePhone } from "@/lib/privacy";
import { forgotPasswordSchema } from "@/lib/validations";

const RESET_TTL_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Provide a verified Gmail or phone number" },
        { status: 400 },
      );
    }

    const email = parsed.data.email?.trim().toLowerCase() || "";
    const phone = parsed.data.phone ? normalizePhone(parsed.data.phone) : "";

    const donor = email
      ? await findDonorByEmail(email)
      : await findDonorByPhone(phone);

    // Generic response avoids account enumeration
    const generic = {
      ok: true,
      message:
        "If this contact is registered and verified, a reset code was created.",
    };

    if (!donor) {
      return NextResponse.json(generic);
    }

    if (email) {
      if (!donor.emailVerified) {
        return NextResponse.json(
          {
            error:
              "This Gmail is not verified yet. Log in and verify first, or use a verified phone.",
          },
          { status: 400 },
        );
      }
      const code = makeCode();
      await updateDonor(donor.id, {
        pendingResetCodeHash: hashCode(code),
        pendingResetChannel: "email",
        pendingResetExpiresAt: new Date(Date.now() + RESET_TTL_MS).toISOString(),
      });
      return NextResponse.json({
        ...generic,
        channel: "email",
        code,
        note: "Use this code to reset your password. In production it would be emailed.",
      });
    }

    if (!donor.phoneVerified) {
      return NextResponse.json(
        {
          error:
            "This phone is not verified yet. Log in and verify first, or use a verified Gmail.",
        },
        { status: 400 },
      );
    }

    const code = makeCode();
    await updateDonor(donor.id, {
      pendingResetCodeHash: hashCode(code),
      pendingResetChannel: "phone",
      pendingResetExpiresAt: new Date(Date.now() + RESET_TTL_MS).toISOString(),
    });
    return NextResponse.json({
      ...generic,
      channel: "phone",
      code,
      note: "Use this code to reset your password. In production it would be sent by SMS.",
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

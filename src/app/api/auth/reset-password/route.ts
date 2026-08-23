import { NextResponse } from "next/server";
import {
  createSession,
  hashCode,
  hashPassword,
  makeCode,
  toSafeDonor,
} from "@/lib/auth";
import { findDonorByEmail, updateDonor } from "@/lib/db";
import { deliverEmailOtp } from "@/lib/otp-delivery";
import {
  isPhonePlaceholderEmail,
  resetPasswordConfirmSchema,
  resetPasswordSendSchema,
} from "@/lib/validations";

const RESET_TTL_MS = 15 * 60 * 1000;

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "***";
  const visible = user.slice(0, Math.min(2, user.length));
  return `${visible}***@${domain}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = String(body?.action || "send");

    if (action === "confirm") {
      return confirmReset(body);
    }
    return sendResetOtp(body);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

async function sendResetOtp(body: unknown) {
  const parsed = resetPasswordSendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid Gmail address" }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const donor = await findDonorByEmail(email);
  if (!donor) {
    return NextResponse.json(
      { error: "No donor account found with this Gmail" },
      { status: 404 },
    );
  }
  if (isPhonePlaceholderEmail(donor.email)) {
    return NextResponse.json(
      {
        error:
          "This account has no Gmail on file. Contact BloodLink support or register with Gmail.",
      },
      { status: 400 },
    );
  }

  const code = makeCode();
  const delivery = await deliverEmailOtp(email, code, { allowInline: false });
  if (!delivery.delivered || delivery.mode !== "email") {
    const detail = delivery.detail || "";
    const missingKey = detail.includes("RESEND_API_KEY is missing");
    return NextResponse.json(
      {
        error: missingKey
          ? "Could not send Gmail OTP. RESEND_API_KEY is not set on the server."
          : `Could not send Gmail OTP. ${detail}`,
        detail,
      },
      { status: 503 },
    );
  }

  await updateDonor(donor.id, {
    pendingResetCodeHash: hashCode(code),
    pendingResetChannel: "email",
    pendingResetExpiresAt: new Date(Date.now() + RESET_TTL_MS).toISOString(),
  });

  return NextResponse.json({
    ok: true,
    emailMasked: maskEmail(email),
    expiresInMinutes: 15,
  });
}

async function confirmReset(body: unknown) {
  const parsed = resetPasswordConfirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid reset data" }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const donor = await findDonorByEmail(email);
  if (!donor?.pendingResetCodeHash || !donor.pendingResetExpiresAt) {
    return NextResponse.json(
      { error: "Reset expired. Request a new Gmail OTP." },
      { status: 410 },
    );
  }

  if (new Date(donor.pendingResetExpiresAt).getTime() < Date.now()) {
    await updateDonor(donor.id, {
      pendingResetCodeHash: null,
      pendingResetChannel: null,
      pendingResetExpiresAt: null,
    });
    return NextResponse.json(
      { error: "OTP expired. Request a new code from Forgot password." },
      { status: 410 },
    );
  }

  if (hashCode(parsed.data.code) !== donor.pendingResetCodeHash) {
    return NextResponse.json({ error: "Incorrect Gmail OTP" }, { status: 400 });
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  const updated = await updateDonor(donor.id, {
    passwordHash,
    pendingResetCodeHash: null,
    pendingResetChannel: null,
    pendingResetExpiresAt: null,
  });
  if (!updated) {
    return NextResponse.json({ error: "Could not update password" }, { status: 500 });
  }

  await createSession(updated.id);
  return NextResponse.json({
    ok: true,
    donor: await toSafeDonor(updated),
  });
}

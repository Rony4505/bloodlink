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
  resetPasswordVerifySchema,
} from "@/lib/validations";

const RESET_TTL_MS = 15 * 60 * 1000;

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "***";
  const visible = user.slice(0, Math.min(2, user.length));
  return `${visible}***@${domain}`;
}

function verifiedResetHash(donorId: string, expiresAt: string): string {
  return hashCode(`reset-verified:${donorId}:${expiresAt}`);
}

function clearResetFields() {
  return {
    pendingResetCodeHash: null,
    pendingResetChannel: null,
    pendingResetExpiresAt: null,
  } as const;
}

async function loadActiveResetDonor(email: string) {
  const donor = await findDonorByEmail(email.trim().toLowerCase());
  if (!donor?.pendingResetCodeHash || !donor.pendingResetExpiresAt) {
    return { donor: null, expired: false as const };
  }
  if (new Date(donor.pendingResetExpiresAt).getTime() < Date.now()) {
    await updateDonor(donor.id, clearResetFields());
    return { donor: null, expired: true as const };
  }
  return { donor, expired: false as const };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = String(body?.action || "send");

    if (action === "verify") {
      return verifyResetOtp(body);
    }
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

  const expiresAt = new Date(Date.now() + RESET_TTL_MS).toISOString();
  await updateDonor(donor.id, {
    pendingResetCodeHash: hashCode(code),
    pendingResetChannel: "email",
    pendingResetExpiresAt: expiresAt,
  });

  return NextResponse.json({
    ok: true,
    emailMasked: maskEmail(email),
    expiresInMinutes: 15,
  });
}

async function verifyResetOtp(body: unknown) {
  const parsed = resetPasswordVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const { donor, expired } = await loadActiveResetDonor(email);
  if (expired) {
    return NextResponse.json(
      { error: "OTP expired. Request a new code from Forgot password." },
      { status: 410 },
    );
  }
  if (!donor) {
    return NextResponse.json(
      { error: "Reset expired. Request a new Gmail OTP." },
      { status: 410 },
    );
  }

  if (hashCode(parsed.data.code) !== donor.pendingResetCodeHash) {
    return NextResponse.json({ error: "Incorrect Gmail OTP" }, { status: 400 });
  }

  await updateDonor(donor.id, {
    pendingResetCodeHash: verifiedResetHash(donor.id, donor.pendingResetExpiresAt!),
    pendingResetChannel: "email",
  });

  return NextResponse.json({ ok: true, verified: true });
}

async function confirmReset(body: unknown) {
  const parsed = resetPasswordConfirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid reset data" }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const { donor, expired } = await loadActiveResetDonor(email);
  if (expired) {
    return NextResponse.json(
      { error: "OTP expired. Request a new code from Forgot password." },
      { status: 410 },
    );
  }
  if (!donor) {
    return NextResponse.json(
      { error: "Reset expired. Request a new Gmail OTP." },
      { status: 410 },
    );
  }

  if (
    donor.pendingResetCodeHash !==
    verifiedResetHash(donor.id, donor.pendingResetExpiresAt!)
  ) {
    return NextResponse.json(
      { error: "Verify Gmail OTP before setting a new password." },
      { status: 400 },
    );
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  const updated = await updateDonor(donor.id, {
    passwordHash,
    ...clearResetFields(),
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

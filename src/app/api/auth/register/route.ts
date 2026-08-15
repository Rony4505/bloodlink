import { NextResponse } from "next/server";
import {
  createSession,
  hashCode,
  hashPassword,
  makeCode,
  toSafeDonor,
} from "@/lib/auth";
import {
  createDonor,
  createPendingRegistration,
  deletePendingRegistration,
  findDonorByEmail,
  findDonorByPhone,
  findPendingRegistration,
  updatePendingRegistration,
} from "@/lib/db";
import { deliverEmailOtp } from "@/lib/otp-delivery";
import {
  normalizeRegisterInput,
  registerConfirmSchema,
  registerResendSchema,
  registerSchema,
} from "@/lib/validations";

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "***";
  const visible = user.slice(0, Math.min(2, user.length));
  return `${visible}***@${domain}`;
}

/** Step 1: validate form, send Gmail OTP only (never return codes in JSON). */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = String(body?.action || "start");

    if (action === "confirm") {
      return confirmRegistration(body);
    }
    if (action === "resend") {
      return resendCodes(body);
    }
    return startRegistration(body);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

async function startRegistration(body: unknown) {
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid registration data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = normalizeRegisterInput(parsed.data);
  if (await findDonorByEmail(data.email)) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 },
    );
  }
  if (await findDonorByPhone(data.phone)) {
    return NextResponse.json(
      { error: "An account with this phone number already exists" },
      { status: 409 },
    );
  }

  const emailCode = makeCode();
  const passwordHash = await hashPassword(data.password);

  const pending = await createPendingRegistration({
    name: data.name,
    email: data.email,
    phone: data.phone,
    passwordHash,
    gender: data.gender,
    bloodGroup: data.bloodGroup,
    district: data.district,
    area: data.area,
    lastDonationDate: data.lastDonationDate,
    donationCount:
      data.donationCount != null
        ? data.donationCount
        : data.lastDonationDate
          ? 1
          : 0,
    bloodIssue: data.bloodIssue,
    emailCodeHash: hashCode(emailCode),
    phoneCodeHash: "",
  });

  // Never allowInline — OTP must only go to Gmail, never in the API body.
  const emailDelivery = await deliverEmailOtp(data.email, emailCode, {
    allowInline: false,
  });

  if (!emailDelivery.delivered || emailDelivery.mode !== "email") {
    await deletePendingRegistration(pending.id);
    return NextResponse.json(
      {
        error:
          "Could not send Gmail OTP. Set RESEND_API_KEY (and OTP_FROM_EMAIL) on Railway — codes are never shown on the website.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    step: "verify",
    pendingId: pending.id,
    emailMasked: maskEmail(data.email),
    expiresInMinutes: 15,
    emailDelivery: "email",
    note: "Enter the OTP sent to your Gmail to create your verified donor account.",
  });
}

async function confirmRegistration(body: unknown) {
  const parsed = registerConfirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
  }

  const pending = await findPendingRegistration(parsed.data.pendingId);
  if (!pending) {
    return NextResponse.json(
      { error: "Verification expired. Please register again." },
      { status: 410 },
    );
  }

  const emailOk = hashCode(parsed.data.emailCode) === pending.emailCodeHash;
  if (!emailOk) {
    return NextResponse.json(
      { error: "Incorrect Gmail verification code" },
      { status: 400 },
    );
  }

  if (await findDonorByEmail(pending.email)) {
    await deletePendingRegistration(pending.id);
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 },
    );
  }
  if (await findDonorByPhone(pending.phone)) {
    await deletePendingRegistration(pending.id);
    return NextResponse.json(
      { error: "An account with this phone number already exists" },
      { status: 409 },
    );
  }

  const donor = await createDonor({
    name: pending.name,
    email: pending.email,
    phone: pending.phone,
    passwordHash: pending.passwordHash,
    gender: pending.gender,
    bloodGroup: pending.bloodGroup,
    district: pending.district,
    area: pending.area,
    lastDonationDate: pending.lastDonationDate,
    donationCount: pending.donationCount,
    bloodIssue: pending.bloodIssue,
    emailVerified: true,
    phoneVerified: false,
    pendingEmailCodeHash: null,
    pendingPhoneCodeHash: null,
    pendingResetCodeHash: null,
    pendingResetChannel: null,
    pendingResetExpiresAt: null,
  });

  await deletePendingRegistration(pending.id);
  await createSession(donor.id);

  return NextResponse.json({
    ok: true,
    step: "done",
    donor: await toSafeDonor(donor),
  });
}

async function resendCodes(body: unknown) {
  const parsed = registerResendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const pending = await findPendingRegistration(parsed.data.pendingId);
  if (!pending) {
    return NextResponse.json(
      { error: "Verification expired. Please register again." },
      { status: 410 },
    );
  }

  const emailCode = makeCode();
  const delivery = await deliverEmailOtp(pending.email, emailCode, {
    allowInline: false,
  });
  if (!delivery.delivered || delivery.mode !== "email") {
    return NextResponse.json(
      {
        error:
          "Could not resend Gmail OTP. Check RESEND_API_KEY on Railway — codes are never shown on the website.",
      },
      { status: 503 },
    );
  }

  await updatePendingRegistration(pending.id, {
    emailCodeHash: hashCode(emailCode),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  });

  return NextResponse.json({
    ok: true,
    pendingId: pending.id,
    emailMasked: maskEmail(pending.email),
    emailDelivery: "email",
  });
}

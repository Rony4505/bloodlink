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
import { deliverSmsOtp } from "@/lib/otp-delivery";
import {
  isPhonePlaceholderEmail,
  normalizeRegisterInput,
  registerConfirmSchema,
  registerResendSchema,
  registerSchema,
} from "@/lib/validations";

function maskPhoneLight(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `${digits.slice(0, 2)}***${digits.slice(-3)}`;
}

/** Step 1: validate form, send phone OTP only (never return codes in JSON). */
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
  if (
    !isPhonePlaceholderEmail(data.email) &&
    (await findDonorByEmail(data.email))
  ) {
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

  const phoneCode = makeCode();
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
    emailCodeHash: "",
    phoneCodeHash: hashCode(phoneCode),
  });

  // Never allowInline — OTP must only go to the phone, never in the API body.
  const smsDelivery = await deliverSmsOtp(data.phone, phoneCode, {
    allowInline: false,
  });

  if (!smsDelivery.delivered || smsDelivery.mode !== "sms") {
    await deletePendingRegistration(pending.id);
    return NextResponse.json(
      {
        error:
          "Could not send SMS OTP. Configure SMS_WEBHOOK_URL so the code reaches your mobile — codes are never shown on the website.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    step: "verify",
    pendingId: pending.id,
    phoneMasked: maskPhoneLight(data.phone),
    expiresInMinutes: 15,
    phoneDelivery: "sms",
    note: "Enter the OTP sent to your mobile to create your account.",
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

  const phoneOk = hashCode(parsed.data.phoneCode) === pending.phoneCodeHash;
  if (!phoneOk) {
    return NextResponse.json(
      { error: "Incorrect mobile verification code" },
      { status: 400 },
    );
  }

  if (
    !isPhonePlaceholderEmail(pending.email) &&
    (await findDonorByEmail(pending.email))
  ) {
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
    emailVerified: false,
    phoneVerified: true,
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

  const phoneCode = makeCode();
  const delivery = await deliverSmsOtp(pending.phone, phoneCode, {
    allowInline: false,
  });
  if (!delivery.delivered || delivery.mode !== "sms") {
    return NextResponse.json(
      {
        error:
          "Could not resend SMS OTP. Check SMS_WEBHOOK_URL — codes are never shown on the website.",
      },
      { status: 503 },
    );
  }

  await updatePendingRegistration(pending.id, {
    phoneCodeHash: hashCode(phoneCode),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  });

  return NextResponse.json({
    ok: true,
    pendingId: pending.id,
    phoneMasked: maskPhoneLight(pending.phone),
    phoneDelivery: "sms",
  });
}

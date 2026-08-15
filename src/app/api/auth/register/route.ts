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
import { deliverEmailOtp, deliverSmsOtp } from "@/lib/otp-delivery";
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

function maskPhoneLight(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `${digits.slice(0, 2)}***${digits.slice(-3)}`;
}

/** Step 1: validate form, send Gmail + phone OTPs, hold account until confirmed. */
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
    bloodIssue: data.bloodIssue,
    emailCodeHash: hashCode(emailCode),
    phoneCodeHash: hashCode(phoneCode),
  });

  const emailDelivery = await deliverEmailOtp(data.email, emailCode);
  const smsDelivery = await deliverSmsOtp(data.phone, phoneCode);

  if (!emailDelivery.delivered || !smsDelivery.delivered) {
    await deletePendingRegistration(pending.id);
    return NextResponse.json(
      {
        error:
          "Could not send verification codes. Configure email/SMS or enable ALLOW_INLINE_OTP.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    step: "verify",
    pendingId: pending.id,
    emailMasked: maskEmail(data.email),
    phoneMasked: maskPhoneLight(data.phone),
    expiresInMinutes: 15,
    emailDelivery: emailDelivery.mode,
    phoneDelivery: smsDelivery.mode,
    ...(emailDelivery.mode === "inline" ? { emailCode } : {}),
    ...(smsDelivery.mode === "inline" ? { phoneCode } : {}),
    note:
      emailDelivery.mode === "inline" || smsDelivery.mode === "inline"
        ? "OTP returned inline because email/SMS provider is not configured yet."
        : "Enter the codes sent to your Gmail and mobile to create your account.",
  });
}

async function confirmRegistration(body: unknown) {
  const parsed = registerConfirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid verification codes" }, { status: 400 });
  }

  const pending = await findPendingRegistration(parsed.data.pendingId);
  if (!pending) {
    return NextResponse.json(
      { error: "Verification expired. Please register again." },
      { status: 410 },
    );
  }

  const emailOk = hashCode(parsed.data.emailCode) === pending.emailCodeHash;
  const phoneOk = hashCode(parsed.data.phoneCode) === pending.phoneCodeHash;
  if (!emailOk || !phoneOk) {
    return NextResponse.json(
      { error: "Incorrect Gmail or phone verification code" },
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
    bloodIssue: pending.bloodIssue,
    emailVerified: true,
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

  const emailCode = makeCode();
  const phoneCode = makeCode();
  const patch: {
    emailCodeHash?: string;
    phoneCodeHash?: string;
    expiresAt: string;
  } = {
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };

  const channel = parsed.data.channel;
  const response: Record<string, unknown> = {
    ok: true,
    pendingId: pending.id,
    emailMasked: maskEmail(pending.email),
    phoneMasked: maskPhoneLight(pending.phone),
  };

  if (channel === "email" || channel === "both") {
    patch.emailCodeHash = hashCode(emailCode);
    const delivery = await deliverEmailOtp(pending.email, emailCode);
    response.emailDelivery = delivery.mode;
    if (delivery.mode === "inline") response.emailCode = emailCode;
  }
  if (channel === "phone" || channel === "both") {
    patch.phoneCodeHash = hashCode(phoneCode);
    const delivery = await deliverSmsOtp(pending.phone, phoneCode);
    response.phoneDelivery = delivery.mode;
    if (delivery.mode === "inline") response.phoneCode = phoneCode;
  }

  await updatePendingRegistration(pending.id, patch);
  return NextResponse.json(response);
}

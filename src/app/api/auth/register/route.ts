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
  findVolunteerByLinkToken,
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

async function resolveVolunteerToken(token: unknown) {
  const value = String(token || "").trim();
  if (!value) return { volunteerId: null as string | null };
  const volunteer = await findVolunteerByLinkToken(value);
  if (!volunteer || !volunteer.enabled) {
    return { error: "Invalid or inactive volunteer link" as const };
  }
  return { volunteerId: volunteer.id };
}

async function startRegistration(body: unknown) {
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid registration data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const volunteerLink = await resolveVolunteerToken(
    (body as { volunteerToken?: string })?.volunteerToken,
  );
  if ("error" in volunteerLink && volunteerLink.error) {
    return NextResponse.json({ error: volunteerLink.error }, { status: 400 });
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
    createdByVolunteerId: volunteerLink.volunteerId,
  });

  // Never allowInline — OTP must only go to Gmail, never in the API body.
  const emailDelivery = await deliverEmailOtp(data.email, emailCode, {
    allowInline: false,
  });

  if (!emailDelivery.delivered || emailDelivery.mode !== "email") {
    await deletePendingRegistration(pending.id);
    const detail = emailDelivery.detail || "";
    const missingKey = detail.includes("RESEND_API_KEY is missing");
    return NextResponse.json(
      {
        error: missingKey
          ? "Could not send Gmail OTP. RESEND_API_KEY is not set on the Railway service that runs this website. Add it under Variables, then Redeploy."
          : `Could not send Gmail OTP. ${detail}. Tip: with Resend free onboarding@resend.dev you can only send to your own Resend account email until you verify a domain.`,
        detail,
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
      {
        error:
          "Incorrect verification code. Use the 6-digit code from your latest email only (not an older message). Tap Resend if needed.",
      },
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
    createdByVolunteerId: pending.createdByVolunteerId,
    volunteerSource: pending.createdByVolunteerId ? "link" : null,
    volunteerApproved: Boolean(pending.createdByVolunteerId) || true,
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
    const detail = delivery.detail || "";
    return NextResponse.json(
      {
        error: detail.includes("RESEND_API_KEY is missing")
          ? "Could not resend Gmail OTP. RESEND_API_KEY is missing on Railway."
          : `Could not resend Gmail OTP. ${detail}`,
        detail,
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

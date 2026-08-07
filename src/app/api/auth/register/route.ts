import { NextResponse } from "next/server";
import { createSession, hashPassword, toSafeDonor } from "@/lib/auth";
import { createDonor, findDonorByEmail } from "@/lib/db";
import { normalizeRegisterInput, registerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid registration data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = normalizeRegisterInput(parsed.data);
    const existing = await findDonorByEmail(data.email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(data.password);
    const donor = await createDonor({
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
      emailVerified: false,
      phoneVerified: false,
      pendingEmailCodeHash: null,
      pendingPhoneCodeHash: null,
      pendingResetCodeHash: null,
      pendingResetChannel: null,
      pendingResetExpiresAt: null,
    });

    await createSession(donor.id);
    return NextResponse.json({
      ok: true,
      donor: await toSafeDonor(donor),
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

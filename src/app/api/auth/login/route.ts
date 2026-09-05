import { NextResponse } from "next/server";
import { createSession, toSafeDonor, verifyPassword } from "@/lib/auth";
import { findDonorByEmail, findDonorByPhone, updateDonor } from "@/lib/db";
import { isValidBdPhone, normalizePhone } from "@/lib/privacy";
import { loginSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid login data" }, { status: 400 });
    }

    const identifier = parsed.data.email.trim();
    let donor = null;
    if (isValidBdPhone(identifier)) {
      donor = await findDonorByPhone(normalizePhone(identifier));
    }
    if (!donor) {
      donor = await findDonorByEmail(identifier.toLowerCase());
    }
    if (!donor) {
      return NextResponse.json(
        { error: "Invalid email/phone or password" },
        { status: 401 },
      );
    }

    const ok = await verifyPassword(parsed.data.password, donor.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid email/phone or password" },
        { status: 401 },
      );
    }

    await createSession(donor.id);
    const updated =
      (await updateDonor(donor.id, {
        lastLoginAt: new Date().toISOString(),
      })) || donor;
    return NextResponse.json({ ok: true, donor: await toSafeDonor(updated) });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

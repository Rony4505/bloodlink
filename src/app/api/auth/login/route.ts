import { NextResponse } from "next/server";
import { createSession, toSafeDonor, verifyPassword } from "@/lib/auth";
import { findDonorByEmail } from "@/lib/db";
import { loginSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid login data" }, { status: 400 });
    }

    const donor = await findDonorByEmail(parsed.data.email.toLowerCase());
    if (!donor) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const ok = await verifyPassword(parsed.data.password, donor.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    await createSession(donor.id);
    return NextResponse.json({ ok: true, donor: await toSafeDonor(donor) });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

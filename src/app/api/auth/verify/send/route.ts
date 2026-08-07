import { NextResponse } from "next/server";
import {
  getCurrentDonor,
  hashCode,
  makeCode,
  toSafeDonor,
} from "@/lib/auth";
import { updateDonor } from "@/lib/db";
import { donorVerifySendSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const current = await getCurrentDonor();
    if (!current) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = donorVerifySendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
    }

    const code = makeCode();
    const hashed = hashCode(code);

    if (parsed.data.channel === "email") {
      if (!current.email) {
        return NextResponse.json({ error: "No email on account" }, { status: 400 });
      }
      const updated = await updateDonor(current.id, {
        pendingEmailCodeHash: hashed,
        emailVerified: false,
      });
      return NextResponse.json({
        ok: true,
        channel: "email",
        destination: current.email,
        code,
        note: "Use this code to verify your Gmail. In production it would be emailed.",
        donor: updated ? await toSafeDonor(updated) : undefined,
      });
    }

    if (!current.phone) {
      return NextResponse.json({ error: "No phone on account" }, { status: 400 });
    }
    const updated = await updateDonor(current.id, {
      pendingPhoneCodeHash: hashed,
      phoneVerified: false,
    });
    return NextResponse.json({
      ok: true,
      channel: "phone",
      destination: current.phone,
      code,
      note: "Use this code to verify your phone. In production it would be sent by SMS.",
      donor: updated ? await toSafeDonor(updated) : undefined,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

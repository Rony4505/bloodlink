import { NextResponse } from "next/server";
import {
  getCurrentDonor,
  hashCode,
  toSafeDonor,
} from "@/lib/auth";
import { updateDonor } from "@/lib/db";
import { donorVerifyConfirmSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const current = await getCurrentDonor();
    if (!current) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = donorVerifyConfirmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const hashed = hashCode(parsed.data.code);

    if (parsed.data.channel === "email") {
      if (
        !current.pendingEmailCodeHash ||
        current.pendingEmailCodeHash !== hashed
      ) {
        return NextResponse.json({ error: "Wrong email code" }, { status: 400 });
      }
      const updated = await updateDonor(current.id, {
        emailVerified: true,
        pendingEmailCodeHash: null,
      });
      return NextResponse.json({
        ok: true,
        emailVerified: true,
        donor: updated ? await toSafeDonor(updated) : undefined,
      });
    }

    if (
      !current.pendingPhoneCodeHash ||
      current.pendingPhoneCodeHash !== hashed
    ) {
      return NextResponse.json({ error: "Wrong phone code" }, { status: 400 });
    }
    const updated = await updateDonor(current.id, {
      phoneVerified: true,
      pendingPhoneCodeHash: null,
    });
    return NextResponse.json({
      ok: true,
      phoneVerified: true,
      donor: updated ? await toSafeDonor(updated) : undefined,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

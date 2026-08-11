import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { isDonorAvailable } from "@/lib/availability";
import { hashIp } from "@/lib/auth";
import {
  countRecentContactRequests,
  createContactRequest,
  findDonorById,
} from "@/lib/db";
import { normalizePhone } from "@/lib/privacy";
import { contactSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid contact request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const donor = await findDonorById(parsed.data.donorId);
    if (!donor) {
      return NextResponse.json({ error: "Donor not found" }, { status: 404 });
    }

    if (!isDonorAvailable(donor.gender, donor.lastDonationDate)) {
      return NextResponse.json(
        { error: "Donor is currently unavailable" },
        { status: 403 },
      );
    }

    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    const ipHash = hashIp(ip);

    const recent = await countRecentContactRequests(ipHash, 60 * 60 * 1000);
    if (recent >= 8) {
      return NextResponse.json(
        { error: "Too many contact requests. Please try later." },
        { status: 429 },
      );
    }

    await createContactRequest({
      donorId: donor.id,
      seekerName: parsed.data.seekerName,
      seekerPhone: normalizePhone(parsed.data.seekerPhone),
      hospital: parsed.data.hospital,
      ipHash,
    });

    const audit = createHash("sha256")
      .update(`${donor.id}:${parsed.data.seekerPhone}:${Date.now()}`)
      .digest("hex")
      .slice(0, 10);

    return NextResponse.json({
      ok: true,
      phone: donor.phone,
      donorName: donor.name,
      audit,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

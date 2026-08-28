import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import {
  createDonor,
  findDonorByPhone,
  findVolunteerByLinkToken,
} from "@/lib/db";
import { normalizePhone } from "@/lib/privacy";
import {
  phonePlaceholderEmail,
  volunteerDonorCreateSchema,
} from "@/lib/validations";

type RouteParams = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const { token } = await params;
  const volunteer = await findVolunteerByLinkToken(token);
  if (!volunteer || !volunteer.enabled) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const parsed = volunteerDonorCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid donor data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const phone = normalizePhone(parsed.data.phone);
    if (await findDonorByPhone(phone)) {
      return NextResponse.json(
        { error: "A donor with this phone already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(parsed.data.tempPassword);
    const donor = await createDonor({
      name: parsed.data.name,
      email: phonePlaceholderEmail(phone),
      phone,
      passwordHash,
      gender: parsed.data.gender,
      bloodGroup: parsed.data.bloodGroup,
      district: parsed.data.district,
      area: parsed.data.area,
      lastDonationDate: parsed.data.lastDonationDate || null,
      donationCount:
        parsed.data.donationCount ??
        (parsed.data.lastDonationDate ? 1 : 0),
      bloodIssue: "",
      emailVerified: false,
      phoneVerified: false,
      createdByVolunteerId: volunteer.id,
      volunteerSource: "manual",
      volunteerApproved: false,
    });

    return NextResponse.json({
      ok: true,
      donor: {
        id: donor.id,
        name: donor.name,
        bloodGroup: donor.bloodGroup,
        district: donor.district,
        area: donor.area,
        createdAt: donor.createdAt,
        volunteerApproved: donor.volunteerApproved,
      },
      message: "Donor saved — waiting for admin approval to count.",
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import {
  getCurrentVolunteer,
  hashPassword,
} from "@/lib/auth";
import {
  createDonor,
  findDonorById,
  findDonorByPhone,
  listDonorsByVolunteer,
  listVolunteerActivities,
  updateDonor,
} from "@/lib/db";
import { normalizePhone } from "@/lib/privacy";
import {
  phonePlaceholderEmail,
  volunteerDonorCreateSchema,
  volunteerDonorUpdateSchema,
} from "@/lib/validations";
import { volunteerHasOpenModule } from "@/lib/volunteer-tasks";

async function requireDonorAddAccess() {
  const volunteer = await getCurrentVolunteer();
  if (!volunteer) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!volunteer.enabled) {
    return { error: NextResponse.json({ error: "Account disabled" }, { status: 403 }) };
  }
  const activities = await listVolunteerActivities(volunteer.id);
  if (!volunteerHasOpenModule(activities, "donor_add")) {
    return {
      error: NextResponse.json(
        { error: "No open donor-add task assigned. Ask admin to assign that work." },
        { status: 403 },
      ),
    };
  }
  return { volunteer };
}

export async function GET() {
  const gate = await requireDonorAddAccess();
  if ("error" in gate && gate.error) return gate.error;
  const donors = await listDonorsByVolunteer(gate.volunteer!.id);
  return NextResponse.json({
    donors: donors.map((d) => ({
      id: d.id,
      name: d.name,
      phone: d.phone,
      bloodGroup: d.bloodGroup,
      district: d.district,
      area: d.area,
      gender: d.gender,
      donationCount: d.donationCount,
    })),
  });
}

export async function POST(request: Request) {
  try {
    const gate = await requireDonorAddAccess();
    if ("error" in gate && gate.error) return gate.error;
    const volunteer = gate.volunteer!;

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
    const lastDonationDate =
      !parsed.data.lastDonationDate || parsed.data.lastDonationDate === ""
        ? null
        : parsed.data.lastDonationDate;

    const donor = await createDonor({
      name: parsed.data.name,
      email: phonePlaceholderEmail(phone),
      phone,
      passwordHash,
      gender: parsed.data.gender,
      bloodGroup: parsed.data.bloodGroup,
      district: parsed.data.district,
      area: parsed.data.area,
      lastDonationDate,
      donationCount: parsed.data.donationCount ?? (lastDonationDate ? 1 : 0),
      bloodIssue: "",
      emailVerified: false,
      phoneVerified: false,
      pendingEmailCodeHash: null,
      pendingPhoneCodeHash: null,
      pendingResetCodeHash: null,
      pendingResetChannel: null,
      pendingResetExpiresAt: null,
      createdByVolunteerId: volunteer.id,
    });

    return NextResponse.json({
      ok: true,
      donor: {
        id: donor.id,
        name: donor.name,
        phone: donor.phone,
        bloodGroup: donor.bloodGroup,
        district: donor.district,
        area: donor.area,
        gender: donor.gender,
        donationCount: donor.donationCount,
      },
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const gate = await requireDonorAddAccess();
    if ("error" in gate && gate.error) return gate.error;
    const volunteer = gate.volunteer!;

    const body = await request.json();
    const parsed = volunteerDonorUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid update" }, { status: 400 });
    }

    const existing = await findDonorById(parsed.data.id);
    if (!existing || existing.createdByVolunteerId !== volunteer.id) {
      return NextResponse.json(
        { error: "Donor not found or not added by you" },
        { status: 404 },
      );
    }

    const patch: { name?: string; phone?: string } = {};
    if (parsed.data.name) patch.name = parsed.data.name;
    if (parsed.data.phone) {
      const phone = normalizePhone(parsed.data.phone);
      const clash = await findDonorByPhone(phone);
      if (clash && clash.id !== existing.id) {
        return NextResponse.json(
          { error: "A donor with this phone already exists" },
          { status: 409 },
        );
      }
      patch.phone = phone;
    }

    const updated = await updateDonor(existing.id, {
      ...patch,
      ...(patch.phone
        ? { email: phonePlaceholderEmail(patch.phone) }
        : {}),
    });

    return NextResponse.json({
      ok: true,
      donor: updated
        ? {
            id: updated.id,
            name: updated.name,
            phone: updated.phone,
            bloodGroup: updated.bloodGroup,
            district: updated.district,
            area: updated.area,
            gender: updated.gender,
            donationCount: updated.donationCount,
          }
        : null,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

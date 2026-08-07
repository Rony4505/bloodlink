import { NextResponse } from "next/server";
import { getCurrentDonor, toSafeDonor } from "@/lib/auth";
import { updateDonor } from "@/lib/db";
import { normalizePhone } from "@/lib/privacy";
import { updateDonorSchema } from "@/lib/validations";

export async function PATCH(request: Request) {
  try {
    const current = await getCurrentDonor();
    if (!current) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateDonorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid update data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const updated = await updateDonor(current.id, {
      name: data.name,
      phone: data.phone ? normalizePhone(data.phone) : undefined,
      gender: data.gender,
      bloodGroup: data.bloodGroup,
      district: data.district,
      area: data.area,
      bloodIssue: data.bloodIssue,
      lastDonationDate:
        data.lastDonationDate === "" || data.lastDonationDate === null
          ? null
          : data.lastDonationDate,
    });

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, donor: await toSafeDonor(updated) });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

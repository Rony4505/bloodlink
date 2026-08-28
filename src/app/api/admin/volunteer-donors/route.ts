import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  listPendingVolunteerDonors,
  setVolunteerDonorApproval,
  deleteDonor,
} from "@/lib/db";

export async function GET() {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const pending = await listPendingVolunteerDonors();
  return NextResponse.json({ pending });
}

export async function PATCH(request: Request) {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const donorId = String(body?.donorId || "").trim();
    const approved = Boolean(body?.approved);
    if (!donorId) {
      return NextResponse.json({ error: "donorId required" }, { status: 400 });
    }
    if (!approved) {
      const deleted = await deleteDonor(donorId);
      if (!deleted) {
        return NextResponse.json({ error: "Donor not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, deleted: true });
    }
    const donor = await setVolunteerDonorApproval(donorId, true);
    if (!donor) {
      return NextResponse.json({ error: "Donor not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, donor: { id: donor.id, volunteerApproved: donor.volunteerApproved } });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

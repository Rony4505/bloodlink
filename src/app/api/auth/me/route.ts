import { NextResponse } from "next/server";
import { getCurrentDonor, toSafeDonor } from "@/lib/auth";
import { donorHasAppInstall } from "@/lib/db";

export async function GET() {
  const donor = await getCurrentDonor();
  if (!donor) {
    return NextResponse.json({ donor: null }, { status: 401 });
  }
  const [safe, appInstalled] = await Promise.all([
    toSafeDonor(donor),
    donorHasAppInstall(donor.id),
  ]);
  return NextResponse.json({ donor: safe, appInstalled });
}

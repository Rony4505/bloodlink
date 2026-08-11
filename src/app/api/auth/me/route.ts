import { NextResponse } from "next/server";
import { getCurrentDonor, toSafeDonor } from "@/lib/auth";

export async function GET() {
  const donor = await getCurrentDonor();
  if (!donor) {
    return NextResponse.json({ donor: null }, { status: 401 });
  }
  return NextResponse.json({ donor: await toSafeDonor(donor) });
}

import { NextResponse } from "next/server";
import { clearVolunteerSession } from "@/lib/auth";

export async function POST() {
  await clearVolunteerSession();
  return NextResponse.json({ ok: true });
}

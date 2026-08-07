import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ admin: false }, { status: 401 });
  }
  return NextResponse.json({ admin: true });
}

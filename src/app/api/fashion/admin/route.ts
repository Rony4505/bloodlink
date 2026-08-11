import { NextResponse } from "next/server";
import {
  clearFashionAdminSession,
  isFashionAdminAuthenticated,
  loginFashionAdmin,
} from "@/lib/fashion/customer-auth";

export async function GET() {
  return NextResponse.json({ admin: await isFashionAdminAuthenticated() });
}

export async function POST(request: Request) {
  const body = await request.json();
  const ok = await loginFashionAdmin(body.password ?? "");
  if (!ok) return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearFashionAdminSession();
  return NextResponse.json({ ok: true });
}

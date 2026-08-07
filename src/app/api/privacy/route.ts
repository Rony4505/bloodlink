import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getPrivacyContent, updateAdminSettings } from "@/lib/db";
import { privacyUpdateSchema } from "@/lib/validations";

export async function GET() {
  const content = await getPrivacyContent();
  return NextResponse.json(content);
}

export async function PUT(request: Request) {
  const admin = await isAdminAuthenticated();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = privacyUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid privacy content" }, { status: 400 });
  }

  await updateAdminSettings({
    privacyBn: parsed.data.privacyBn,
    privacyEn: parsed.data.privacyEn,
  });

  return NextResponse.json({ ok: true });
}

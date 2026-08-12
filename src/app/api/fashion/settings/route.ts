import { NextResponse } from "next/server";
import { isFashionAdminAuthenticated } from "@/lib/fashion/customer-auth";
import { getStoreSettings, updateStoreSettings } from "@/lib/fashion/store";

export async function GET() {
  const settings = await getStoreSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  if (!(await isFashionAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const settings = await updateStoreSettings(body);
    return NextResponse.json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Settings save failed";
    console.error("[fashion/settings]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

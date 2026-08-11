import { NextResponse } from "next/server";
import { isFashionAdminAuthenticated } from "@/lib/fashion/customer-auth";
import {
  deletePromoBanner,
  getStoreSettings,
  upsertPromoBanner,
} from "@/lib/fashion/store";
import type { PromoBanner } from "@/lib/fashion/types";

export async function GET() {
  if (!(await isFashionAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const settings = await getStoreSettings();
  return NextResponse.json({ banners: settings.promoBanners ?? [] });
}

export async function POST(request: Request) {
  if (!(await isFashionAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as PromoBanner;
  const banner = await upsertPromoBanner({
    ...body,
    id: body.id || `pb${Date.now()}`,
    sortOrder: body.sortOrder ?? Date.now(),
    active: body.active !== false,
  });
  return NextResponse.json({ banner });
}

export async function DELETE(request: Request) {
  if (!(await isFashionAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await deletePromoBanner(id);
  return NextResponse.json({ ok: true });
}

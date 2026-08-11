import { NextResponse } from "next/server";
import { isFashionAdminAuthenticated } from "@/lib/fashion/customer-auth";
import { deleteCategory, listCategories, updateCategories } from "@/lib/fashion/store";
import type { Category } from "@/lib/fashion/types";

export async function GET() {
  const categories = await listCategories();
  return NextResponse.json({ categories });
}

export async function PUT(request: Request) {
  if (!(await isFashionAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const categories = (body.categories ?? []) as Category[];
  const updated = await updateCategories(categories);
  return NextResponse.json({ categories: updated });
}

export async function DELETE(request: Request) {
  if (!(await isFashionAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  await deleteCategory(slug);
  return NextResponse.json({ ok: true });
}

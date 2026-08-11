import { NextResponse } from "next/server";
import { isFashionAdminAuthenticated } from "@/lib/fashion/customer-auth";
import { deleteProduct, listProducts, upsertProduct } from "@/lib/fashion/store";
import type { ProductInput } from "@/lib/fashion/types";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  if (!(await isFashionAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as ProductInput;
  const product = await upsertProduct({ ...body, id });
  return NextResponse.json({ product });
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!(await isFashionAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const ok = await deleteProduct(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const products = await listProducts();
  const product = products.find((item) => item.id === id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product });
}

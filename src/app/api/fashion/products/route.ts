import { NextResponse } from "next/server";
import { isFashionAdminAuthenticated } from "@/lib/fashion/customer-auth";
import { listProducts, upsertProduct } from "@/lib/fashion/store";
import type { ProductInput } from "@/lib/fashion/types";

export async function GET() {
  const products = await listProducts();
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  if (!(await isFashionAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as ProductInput;
  const product = await upsertProduct(body);
  return NextResponse.json({ product });
}

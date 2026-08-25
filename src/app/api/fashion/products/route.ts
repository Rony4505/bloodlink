import { NextResponse } from "next/server";
import { isFashionAdminAuthenticated } from "@/lib/fashion/customer-auth";
import { listProducts, upsertProduct } from "@/lib/fashion/store";
import type { ProductInput } from "@/lib/fashion/types";

export async function GET() {
  const products = await listProducts();
  // Never CDN-cache an empty catalog — that can hide live products after a brief race.
  const cache =
    products.length > 0
      ? "public, s-maxage=30, stale-while-revalidate=60"
      : "private, no-store";
  return NextResponse.json(
    { products },
    { headers: { "Cache-Control": cache } },
  );
}

export async function POST(request: Request) {
  if (!(await isFashionAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as ProductInput;
  const product = await upsertProduct(body);
  return NextResponse.json({ product });
}

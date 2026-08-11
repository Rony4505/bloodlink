import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/fashion/customer-auth";
import { getVipDiscountPreview } from "@/lib/fashion/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subtotal = Number(searchParams.get("subtotal") || 0);
  const customer = await getCurrentCustomer();
  const preview = await getVipDiscountPreview({
    customerId: customer?.id,
    subtotal,
  });
  return NextResponse.json({ vip: preview, customerId: customer?.id ?? null });
}

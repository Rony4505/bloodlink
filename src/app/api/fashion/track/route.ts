import { NextResponse } from "next/server";
import { getOrderByTrackingNumber } from "@/lib/fashion/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tracking = searchParams.get("tracking");
  if (!tracking?.trim()) {
    return NextResponse.json({ error: "Tracking number required" }, { status: 400 });
  }

  const order = await getOrderByTrackingNumber(tracking);
  if (!order) {
    return NextResponse.json({ error: "অর্ডার পাওয়া যায়নি" }, { status: 404 });
  }

  return NextResponse.json({ order });
}

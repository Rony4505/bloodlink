import { NextResponse } from "next/server";
import { validateCoupon } from "@/lib/fashion/store";

export async function POST(request: Request) {
  const body = await request.json();
  const code = body.code as string;
  const subtotal = Number(body.subtotal ?? 0);
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const coupon = await validateCoupon(code, subtotal);
  if (!coupon) {
    return NextResponse.json({ valid: false, error: "কুপন সঠিক নয় বা মেয়াদ শেষ" });
  }

  const discount =
    coupon.discountType === "percent"
      ? Math.round(subtotal * (coupon.discountValue / 100))
      : coupon.discountValue;

  return NextResponse.json({ valid: true, coupon, discount });
}

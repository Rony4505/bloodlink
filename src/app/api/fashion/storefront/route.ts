import { NextResponse } from "next/server";
import {
  getActiveOffers,
  getActivePromoBanners,
  getNewProducts,
  getStoreSettings,
  listPublicCoupons,
} from "@/lib/fashion/store";

export async function GET() {
  const [settings, offers, newProducts, banners, coupons] = await Promise.all([
    getStoreSettings(),
    getActiveOffers(),
    getNewProducts(14),
    getActivePromoBanners(),
    listPublicCoupons(),
  ]);
  return NextResponse.json({ settings, offers, newProducts, banners, coupons });
}

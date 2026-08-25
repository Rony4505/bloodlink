import { NextResponse } from "next/server";
import {
  getActiveOffers,
  getActivePromoBanners,
  getNewProducts,
  getStoreSettings,
  listPublicCoupons,
} from "@/lib/fashion/store";

const PUBLIC_CACHE = "public, s-maxage=60, stale-while-revalidate=120";

export async function GET() {
  const [settings, offers, newProducts, banners, coupons] = await Promise.all([
    getStoreSettings(),
    getActiveOffers(),
    getNewProducts(14),
    getActivePromoBanners(),
    listPublicCoupons(),
  ]);
  const promoFingerprint = [
    ...coupons.map((c) => `c:${c.id}:${c.code}`),
    ...offers.map((p) => `o:${p.id}`),
    ...newProducts.filter((p) => p.offerActive).map((p) => `p:${p.id}`),
    ...banners.map((b) => `b:${b.id}`),
  ]
    .sort()
    .join("|");

  return NextResponse.json(
    { settings, offers, newProducts, banners, coupons, promoFingerprint },
    { headers: { "Cache-Control": PUBLIC_CACHE } },
  );
}

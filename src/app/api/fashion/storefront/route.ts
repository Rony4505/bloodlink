import { NextResponse } from "next/server";
import { getActiveOffers, getNewProducts, getStoreSettings } from "@/lib/fashion/store";

export async function GET() {
  const [settings, offers, newProducts] = await Promise.all([
    getStoreSettings(),
    getActiveOffers(),
    getNewProducts(14),
  ]);
  return NextResponse.json({ settings, offers, newProducts });
}

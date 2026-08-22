import { NextResponse } from "next/server";
import { calculateDeliveryFee } from "@/lib/fashion/delivery";
import { getStoreSettings } from "@/lib/fashion/store";

export async function POST(request: Request) {
  const body = await request.json();
  const district = String(body.district ?? "").trim();
  const subtotal = Number(body.subtotal ?? 0);
  const settings = await getStoreSettings();

  if (!district) {
    return NextResponse.json({
      fee: 0,
      rules: settings.deliveryRules.filter((r) => r.active),
    });
  }

  const fee = calculateDeliveryFee(settings, district, subtotal);
  return NextResponse.json({ fee, rules: settings.deliveryRules.filter((r) => r.active) });
}

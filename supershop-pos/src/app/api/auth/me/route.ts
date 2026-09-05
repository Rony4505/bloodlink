import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readStore } from "@/lib/store";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  const store = await readStore();
  return NextResponse.json({
    authenticated: true,
    cashier: session.cashier,
    settings: {
      shopName: store.settings.shopName,
      tagline: store.settings.tagline,
      currency: store.settings.currency,
      address: store.settings.address,
      phone: store.settings.phone,
    },
  });
}

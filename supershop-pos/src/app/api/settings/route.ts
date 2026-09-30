import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { readStore, updateStore } from "@/lib/store";

const settingsSchema = z.object({
  shopName: z.string().trim().min(1).max(80).optional(),
  tagline: z.string().trim().max(120).optional(),
  address: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(40).optional(),
  currency: z.string().trim().min(1).max(8).optional(),
  pin: z.string().min(4).max(12).optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const store = await readStore();
  return NextResponse.json({
    settings: {
      shopName: store.settings.shopName,
      tagline: store.settings.tagline,
      address: store.settings.address,
      phone: store.settings.phone,
      currency: store.settings.currency,
      taxRate: store.settings.taxRate,
    },
  });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = settingsSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
  }

  const store = await updateStore(async (data) => {
    const { pin, ...rest } = parsed.data;
    data.settings = { ...data.settings, ...rest };
    if (pin) {
      data.settings.pinHash = await bcrypt.hash(pin, 10);
    }
    return data;
  });

  return NextResponse.json({
    settings: {
      shopName: store.settings.shopName,
      tagline: store.settings.tagline,
      address: store.settings.address,
      phone: store.settings.phone,
      currency: store.settings.currency,
      taxRate: store.settings.taxRate,
    },
  });
}

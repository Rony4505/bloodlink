import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, verifyPin } from "@/lib/auth";

const bodySchema = z.object({
  pin: z.string().min(4).max(12),
  cashier: z.string().trim().min(1).max(40).optional(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 400 });
  }

  const ok = await verifyPin(parsed.data.pin);
  if (!ok) {
    return NextResponse.json({ error: "Wrong PIN" }, { status: 401 });
  }

  await createSession(parsed.data.cashier || "Cashier");
  return NextResponse.json({ ok: true });
}

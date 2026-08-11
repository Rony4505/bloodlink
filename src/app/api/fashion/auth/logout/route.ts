import { NextResponse } from "next/server";
import { clearCustomerSession } from "@/lib/fashion/customer-auth";

export async function POST() {
  await clearCustomerSession();
  return NextResponse.json({ ok: true });
}

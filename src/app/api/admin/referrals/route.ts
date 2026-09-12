import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  adminResolveWithdraw,
  listReferralAdminOverview,
} from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const resolveSchema = z.object({
  action: z.literal("resolve-withdraw"),
  id: z.string().uuid(),
  status: z.enum(["paid", "rejected"]),
  note: z.string().trim().max(500).optional().default(""),
});

export async function GET() {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const overview = await listReferralAdminOverview();
  return NextResponse.json({ ok: true, ...overview });
}

export async function PATCH(request: Request) {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = resolveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const resolved = await adminResolveWithdraw(
      parsed.data.id,
      parsed.data.status,
      parsed.data.note,
    );
    if (!resolved) {
      return NextResponse.json(
        { error: "Request not found or already resolved" },
        { status: 404 },
      );
    }
    const overview = await listReferralAdminOverview();
    return NextResponse.json({ ok: true, request: resolved, ...overview });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

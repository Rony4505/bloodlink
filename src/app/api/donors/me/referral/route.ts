import { NextResponse } from "next/server";
import { getCurrentDonor } from "@/lib/auth";
import {
  acceptReferralRules,
  getDonorReferralDashboard,
  requestReferralWithdraw,
  updateDonorPayoutAccounts,
} from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("accept-rules") }),
  z.object({
    action: z.literal("save-payout"),
    bkash: z.string().trim().max(20).optional(),
    nagad: z.string().trim().max(20).optional(),
  }),
  z.object({
    action: z.literal("request-withdraw"),
    method: z.enum(["bkash", "nagad"]).optional(),
  }),
]);

export async function GET() {
  const donor = await getCurrentDonor();
  if (!donor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dashboard = await getDonorReferralDashboard(donor.id);
  if (!dashboard) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, ...dashboard });
}

export async function PATCH(request: Request) {
  const donor = await getCurrentDonor();
  if (!donor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (parsed.data.action === "accept-rules") {
      const updated = await acceptReferralRules(donor.id);
      if (!updated) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      const dashboard = await getDonorReferralDashboard(donor.id);
      return NextResponse.json({ ok: true, ...dashboard });
    }

    if (parsed.data.action === "save-payout") {
      if (donor.referralBkash || donor.referralNagad) {
        return NextResponse.json(
          { error: "Payout account is locked" },
          { status: 400 },
        );
      }
      const updated = await updateDonorPayoutAccounts(donor.id, {
        bkash: parsed.data.bkash,
        nagad: parsed.data.nagad,
      });
      if (!updated) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      const dashboard = await getDonorReferralDashboard(donor.id);
      return NextResponse.json({ ok: true, ...dashboard });
    }

    const result = await requestReferralWithdraw(
      donor.id,
      parsed.data.method,
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const dashboard = await getDonorReferralDashboard(donor.id);
    return NextResponse.json({
      ok: true,
      request: result.request,
      ...dashboard,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

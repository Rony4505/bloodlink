import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  listContactChangeRequests,
  listDonors,
  resolveContactChangeRequest,
} from "@/lib/db";
import { z } from "zod";

const decisionSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
});

export async function GET() {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [requests, donors] = await Promise.all([
    listContactChangeRequests(),
    listDonors(),
  ]);
  const donorMap = new Map(donors.map((d) => [d.id, d]));

  return NextResponse.json({
    requests: requests.map((r) => ({
      ...r,
      donorName: donorMap.get(r.donorId)?.name || "Unknown",
    })),
  });
}

export async function PATCH(request: Request) {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = decisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
    }

    const resolved = await resolveContactChangeRequest(
      parsed.data.id,
      parsed.data.decision,
    );
    if (!resolved) {
      return NextResponse.json(
        { error: "Request not found or already resolved" },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, request: resolved });
  } catch (err) {
    if (err instanceof Error && err.message === "EMAIL_TAKEN") {
      return NextResponse.json(
        { error: "That email is already used by another account" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

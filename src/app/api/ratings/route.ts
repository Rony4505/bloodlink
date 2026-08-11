import { NextResponse } from "next/server";
import { getCurrentDonor } from "@/lib/auth";
import { createRating, findDonorById, listRatingsForDonor } from "@/lib/db";
import { normalizePhone } from "@/lib/privacy";
import { ratingSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const donorId = new URL(request.url).searchParams.get("donorId");
  if (!donorId) {
    return NextResponse.json({ error: "donorId required" }, { status: 400 });
  }
  const ratings = await listRatingsForDonor(donorId);
  return NextResponse.json({
    ratings: ratings.map((r) => ({
      id: r.id,
      seekerName: r.seekerName,
      stars: r.stars,
      comment: r.comment,
      createdAt: r.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = ratingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid rating data" }, { status: 400 });
    }

    const donor = await findDonorById(parsed.data.donorId);
    if (!donor) {
      return NextResponse.json({ error: "Donor not found" }, { status: 404 });
    }

    const current = await getCurrentDonor();
    const seekerPhone = normalizePhone(parsed.data.seekerPhone);
    if (current?.id === donor.id || seekerPhone === donor.phone) {
      return NextResponse.json(
        { error: "You cannot rate your own donor profile" },
        { status: 403 },
      );
    }

    const rating = await createRating({
      donorId: parsed.data.donorId,
      seekerName: parsed.data.seekerName,
      seekerPhone,
      stars: parsed.data.stars,
      comment: parsed.data.comment || "",
    });

    return NextResponse.json({ ok: true, rating });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

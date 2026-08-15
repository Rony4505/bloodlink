import { NextResponse } from "next/server";
import {
  getNextEligibleDate,
  isDonorAvailable,
} from "@/lib/availability";
import { isDonorVerified } from "@/lib/auth";
import { getRatingStats, listDonors } from "@/lib/db";
import { maskPhone } from "@/lib/privacy";
import type { PublicDonor } from "@/lib/types";
import { searchSchema } from "@/lib/validations";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = searchSchema.safeParse({
      bloodGroup: searchParams.get("bloodGroup") || undefined,
      district: searchParams.get("district") || undefined,
      availableOnly: searchParams.get("availableOnly") || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid filters" }, { status: 400 });
    }

    const availableOnly =
      parsed.data.availableOnly === true ||
      parsed.data.availableOnly === "true";

    const donors = await listDonors();
    const createdAtById = new Map(donors.map((d) => [d.id, d.createdAt]));
    const results: PublicDonor[] = [];

    for (const d of donors) {
      const available = isDonorAvailable(d.gender, d.lastDonationDate);
      const stats = await getRatingStats(d.id);
      const emailVerified = Boolean(d.emailVerified);
      const phoneVerified = Boolean(d.phoneVerified);
      results.push({
        id: d.id,
        name: d.name,
        gender: d.gender,
        bloodGroup: d.bloodGroup,
        district: d.district,
        area: d.area,
        available,
        lastDonationDate: d.lastDonationDate,
        nextEligibleDate: getNextEligibleDate(d.gender, d.lastDonationDate),
        phoneMasked: maskPhone(d.phone),
        bloodIssue: d.bloodIssue || "",
        donationCount: Math.max(0, Math.floor(Number(d.donationCount) || 0)),
        avgRating: stats.avg,
        ratingCount: stats.count,
        emailVerified,
        phoneVerified,
        verified: isDonorVerified({ emailVerified, phoneVerified }),
      });
    }

    const filtered = results
      .filter((d) =>
        parsed.data.bloodGroup ? d.bloodGroup === parsed.data.bloodGroup : true,
      )
      .filter((d) =>
        parsed.data.district ? d.district === parsed.data.district : true,
      )
      .filter((d) => (availableOnly ? d.available : true))
      .sort((a, b) => {
        // Newest registrations first (user request).
        const tb = new Date(createdAtById.get(b.id) || 0).getTime();
        const ta = new Date(createdAtById.get(a.id) || 0).getTime();
        if (tb !== ta) return tb - ta;
        const avail = Number(b.available) - Number(a.available);
        if (avail !== 0) return avail;
        return Number(b.verified) - Number(a.verified);
      });

    return NextResponse.json({ donors: filtered });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

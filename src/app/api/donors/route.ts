import { NextResponse } from "next/server";
import {
  getNextEligibleDate,
  isDonorAvailable,
} from "@/lib/availability";
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
    const results: PublicDonor[] = [];

    for (const d of donors) {
      const available = isDonorAvailable(d.gender, d.lastDonationDate);
      const stats = await getRatingStats(d.id);
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
        avgRating: stats.avg,
        ratingCount: stats.count,
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
      .sort((a, b) => Number(b.available) - Number(a.available));

    return NextResponse.json({ donors: filtered });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

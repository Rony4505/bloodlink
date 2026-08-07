import { NextResponse } from "next/server";
import {
  getNextEligibleDate,
  isDonorAvailable,
} from "@/lib/availability";
import { isAdminAuthenticated, isDonorVerified } from "@/lib/auth";
import {
  deleteDonor,
  getRatingStats,
  listContactRequests,
  listDonors,
  listPosts,
} from "@/lib/db";

export async function GET() {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const donors = await listDonors();
  const requests = await listContactRequests();
  const posts = await listPosts();
  const donorMap = new Map(donors.map((d) => [d.id, d]));

  const mapped = [];
  for (const d of donors) {
    const available = isDonorAvailable(d.gender, d.lastDonationDate);
    const stats = await getRatingStats(d.id);
    const emailVerified = Boolean(d.emailVerified);
    const phoneVerified = Boolean(d.phoneVerified);
    mapped.push({
      id: d.id,
      name: d.name,
      email: d.email,
      phone: d.phone,
      gender: d.gender,
      bloodGroup: d.bloodGroup,
      district: d.district,
      area: d.area,
      available,
      lastDonationDate: d.lastDonationDate,
      nextEligibleDate: getNextEligibleDate(d.gender, d.lastDonationDate),
      bloodIssue: d.bloodIssue || "",
      avgRating: stats.avg,
      ratingCount: stats.count,
      emailVerified,
      phoneVerified,
      verified: isDonorVerified(d),
      createdAt: d.createdAt,
    });
  }

  const contactRequests = requests.map((r) => {
    const donor = donorMap.get(r.donorId);
    return {
      id: r.id,
      seekerName: r.seekerName,
      seekerPhone: r.seekerPhone,
      hospital: r.hospital,
      createdAt: r.createdAt,
      donorId: r.donorId,
      donorName: donor?.name || "Unknown donor",
      donorPhone: donor?.phone || "—",
      donorBloodGroup: donor?.bloodGroup || "—",
      donorDistrict: donor?.district || "—",
      donorArea: donor?.area || "—",
      donorVerified: donor ? isDonorVerified(donor) : false,
    };
  });

  return NextResponse.json({
    donors: mapped,
    contactRequests,
    posts,
    stats: {
      totalDonors: mapped.length,
      availableNow: mapped.filter((d) => d.available).length,
      verifiedDonors: mapped.filter((d) => d.verified).length,
      totalRequests: requests.length,
      totalPosts: posts.length,
    },
  });
}

export async function DELETE(request: Request) {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing donor id" }, { status: 400 });
  }

  const deleted = await deleteDonor(id);
  if (!deleted) {
    return NextResponse.json({ error: "Donor not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

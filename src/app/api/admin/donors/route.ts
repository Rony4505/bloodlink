import { NextResponse } from "next/server";
import {
  getNextEligibleDate,
  isDonorAvailable,
} from "@/lib/availability";
import { isAdminAuthenticated } from "@/lib/auth";
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
      donationCount: Math.max(0, Math.floor(Number(d.donationCount) || 0)),
      bloodIssue: d.bloodIssue || "",
      avgRating: stats.avg,
      ratingCount: stats.count,
      createdAt: d.createdAt,
    });
  }

  mapped.sort((a, b) => {
    const tb = Date.parse(b.createdAt || "") || 0;
    const ta = Date.parse(a.createdAt || "") || 0;
    return tb - ta;
  });

  const contactRequests = requests.map((r) => {
    const donor = r.donorId ? donorMap.get(r.donorId) : null;
    const seekerAccount = r.seekerUserId
      ? donorMap.get(r.seekerUserId)
      : null;
    return {
      id: r.id,
      kind: r.kind || "donor_phone",
      seekerName: r.seekerName,
      seekerPhone: r.seekerPhone,
      hospital: r.hospital,
      createdAt: r.createdAt,
      auditCode: r.auditCode || "",
      seekerUserId: r.seekerUserId,
      seekerAccountName: seekerAccount?.name || null,
      seekerAccountEmail: seekerAccount?.email || null,
      donorId: r.donorId,
      postId: r.postId,
      donorName: r.targetName || donor?.name || "Unknown",
      donorPhone: r.targetPhone || donor?.phone || "—",
      donorBloodGroup: r.targetBloodGroup || donor?.bloodGroup || "—",
      donorDistrict: r.targetDistrict || donor?.district || "—",
      donorArea: r.targetArea || donor?.area || "—",
      donorEmail: donor?.email || "—",
      contextNote: r.contextNote || "",
    };
  });

  return NextResponse.json({
    donors: mapped,
    contactRequests,
    posts,
    stats: {
      totalDonors: mapped.length,
      availableNow: mapped.filter((d) => d.available).length,
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

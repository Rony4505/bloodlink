import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { isDonorAvailable } from "@/lib/availability";
import { getCurrentDonor, hashIp } from "@/lib/auth";
import {
  createContactRequest,
  findPostById,
  hasRecentPostContactLog,
} from "@/lib/db";
import { maskPhone } from "@/lib/privacy";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const post = await findPostById(id);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const donor = await getCurrentDonor();
    const canContact =
      Boolean(donor) &&
      isDonorAvailable(donor!.gender, donor!.lastDonationDate) &&
      donor!.bloodGroup === post.bloodGroup &&
      !donor!.bloodIssue;

    if (canContact && donor) {
      const already = await hasRecentPostContactLog(post.id, donor.id);
      if (!already) {
        const forwarded = request.headers.get("x-forwarded-for");
        const ip = forwarded?.split(",")[0]?.trim() || "unknown";
        const auditCode = createHash("sha256")
          .update(`post:${post.id}:${donor.id}:${Date.now()}`)
          .digest("hex")
          .slice(0, 10);
        await createContactRequest({
          kind: "post_phone",
          donorId: donor.id,
          postId: post.id,
          seekerName: donor.name,
          seekerPhone: donor.phone,
          hospital: post.hospital,
          seekerUserId: donor.id,
          auditCode,
          targetName: post.posterName,
          targetPhone: post.posterPhone,
          targetBloodGroup: post.bloodGroup,
          targetDistrict: post.district,
          targetArea: post.area,
          contextNote: `Patient: ${post.patientName} · Needed by: ${post.neededBy} · ${post.unitsNeeded} bag(s)`,
          ipHash: hashIp(ip),
        });
      }
    }

    return NextResponse.json({
      post: {
        id: post.id,
        posterName: post.posterName,
        patientName: post.patientName,
        relation: post.relation,
        bloodGroup: post.bloodGroup,
        unitsNeeded: post.unitsNeeded,
        district: post.district,
        area: post.area,
        hospital: post.hospital,
        neededBy: post.neededBy,
        message: post.message,
        urgency: post.urgency,
        createdAt: post.createdAt,
        phoneMasked: maskPhone(post.posterPhone),
        contactPhone: canContact ? post.posterPhone : null,
        canContact,
        contactBlockedReason: !donor
          ? "login_required"
          : donor.bloodGroup !== post.bloodGroup
            ? "blood_mismatch"
            : !isDonorAvailable(donor.gender, donor.lastDonationDate)
              ? "not_available"
              : donor.bloodIssue
                ? "blood_issue"
                : null,
      },
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

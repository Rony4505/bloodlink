import { NextResponse } from "next/server";
import { isDonorAvailable } from "@/lib/availability";
import { getCurrentDonor } from "@/lib/auth";
import { findPostById } from "@/lib/db";
import { maskPhone } from "@/lib/privacy";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
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

import { NextResponse } from "next/server";
import { createPost, listPosts } from "@/lib/db";
import { maskPhone, normalizePhone } from "@/lib/privacy";
import { postSchema } from "@/lib/validations";

function toPublicPost(post: Awaited<ReturnType<typeof listPosts>>[number]) {
  return {
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
  };
}

export async function GET() {
  const posts = await listPosts();
  return NextResponse.json({ posts: posts.map(toPublicPost) });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please fill all details correctly", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const post = await createPost({
      ...parsed.data,
      posterPhone: normalizePhone(parsed.data.posterPhone),
    });

    return NextResponse.json({ ok: true, post: toPublicPost(post) });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

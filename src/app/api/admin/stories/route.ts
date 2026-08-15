import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  approvePendingSuccessStory,
  listPendingSuccessStories,
  rejectPendingSuccessStory,
} from "@/lib/db";

export async function GET() {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const stories = await listPendingSuccessStories();
  return NextResponse.json({ stories });
}

export async function POST(request: Request) {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = String(body?.id || "");
    const action = String(body?.action || "");
    if (!id) {
      return NextResponse.json({ error: "Missing story id" }, { status: 400 });
    }

    if (action === "approve") {
      const result = await approvePendingSuccessStory(id);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "reject") {
      const removed = await rejectPendingSuccessStory(id);
      if (!removed) {
        return NextResponse.json({ error: "Story not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

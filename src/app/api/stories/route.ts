import { NextResponse } from "next/server";
import { createPendingSuccessStory } from "@/lib/db";
import { successStorySubmitSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = successStorySubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please share your name and a short story (at least 20 characters)." },
        { status: 400 },
      );
    }

    const quote = parsed.data.quote.trim();
    await createPendingSuccessStory({
      name: parsed.data.name,
      handle: parsed.data.handle || "",
      quoteBn: quote,
      quoteEn: quote,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

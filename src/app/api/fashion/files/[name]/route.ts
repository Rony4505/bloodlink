import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { fashionUploadDir } from "@/lib/fashion/paths";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ name: string }> },
) {
  const { name } = await context.params;
  const safe = path.basename(name);
  if (!safe || safe !== name || safe.includes("..")) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }

  try {
    const filePath = path.join(/* turbopackIgnore: true */ fashionUploadDir(), safe);
    const data = await readFile(filePath);
    const ext = safe.split(".").pop()?.toLowerCase() || "jpg";
    return new NextResponse(data, {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

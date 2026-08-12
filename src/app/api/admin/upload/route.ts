import { randomUUID } from "crypto";
import { writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { saveUploadToPostgres } from "@/lib/pg-store";
import {
  detectImageType,
  isLikelyHeic,
  uploadsDir,
} from "@/lib/uploads";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image file" }, { status: 400 });
    }
    if (file.size <= 0) {
      return NextResponse.json({ error: "Empty image file" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image must be under 8 MB. Compress or choose a smaller photo." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (isLikelyHeic(buffer, file.type, file.name || "")) {
      return NextResponse.json(
        {
          error:
            "iPhone HEIC photos are not supported. In Photos, share/export as JPG, or turn off “Most Compatible” / use JPG.",
        },
        { status: 400 },
      );
    }

    const detected = detectImageType(buffer, file.type, file.name || "");
    if (!detected) {
      return NextResponse.json(
        { error: "Only JPG, PNG, WEBP, or GIF images are allowed" },
        { status: 400 },
      );
    }

    const name = `${randomUUID()}.${detected.ext}`;
    let diskOk = false;
    try {
      const dir = uploadsDir();
      await writeFile(path.join(/* turbopackIgnore: true */ dir, name), buffer);
      diskOk = true;
    } catch (err) {
      console.error("[bloodlink] disk upload failed", err);
    }

    const pgOk = await saveUploadToPostgres(name, detected.mime, buffer);
    if (!diskOk && !pgOk) {
      return NextResponse.json(
        {
          error:
            "Could not store image. Ensure Railway Volume /app/data is mounted or Postgres is connected.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      url: `/api/uploads/${name}`,
      name,
      stored: { disk: diskOk, postgres: pgOk },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Upload failed",
      },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { isFashionAdminAuthenticated } from "@/lib/fashion/customer-auth";
import { fashionUploadDir, fashionUploadUrl } from "@/lib/fashion/paths";
import { saveUploadToPostgres } from "@/lib/pg-store";
import {
  detectImageType,
  isLikelyHeic,
} from "@/lib/uploads";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  if (!(await isFashionAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }
  if (file.size <= 0) {
    return NextResponse.json({ error: "Empty image file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image must be under 8 MB. Use 900×1200 JPG/WebP under 500 KB when possible." },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (isLikelyHeic(buffer, file.type, file.name || "")) {
    return NextResponse.json(
      {
        error:
          "iPhone HEIC photos are not supported. Export as JPG or use a JPG/WebP file.",
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

  const filename = `fashion-${Date.now()}.${detected.ext}`;
  const uploadDir = fashionUploadDir();
  let diskOk = false;
  try {
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);
    diskOk = true;
  } catch (err) {
    console.error("[fashion] disk upload failed", err);
  }

  const pgOk = await saveUploadToPostgres(filename, detected.mime, buffer);
  if (!diskOk && !pgOk) {
    return NextResponse.json(
      {
        error:
          "Could not store image. Connect Postgres or mount Railway Volume at /app/data.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    url: fashionUploadUrl(filename),
    stored: { disk: diskOk, postgres: pgOk },
  });
}

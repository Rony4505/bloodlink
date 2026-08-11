import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { loadUploadFromPostgres } from "@/lib/pg-store";
import { contentTypeForName, uploadFilePath } from "@/lib/uploads";

export const runtime = "nodejs";

type Params = { params: Promise<{ name: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { name } = await params;
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const full = uploadFilePath(name);
  if (full) {
    const data = await readFile(full);
    return new NextResponse(data, {
      headers: {
        "Content-Type": contentTypeForName(name),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  const fromPg = await loadUploadFromPostgres(name);
  if (fromPg) {
    return new NextResponse(new Uint8Array(fromPg.data), {
      headers: {
        "Content-Type": fromPg.contentType || contentTypeForName(name),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

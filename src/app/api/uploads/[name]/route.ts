import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { contentTypeForName, uploadFilePath } from "@/lib/uploads";

type Params = { params: Promise<{ name: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { name } = await params;
  const full = uploadFilePath(name);
  if (!full) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const data = await readFile(full);
  return new NextResponse(data, {
    headers: {
      "Content-Type": contentTypeForName(name),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

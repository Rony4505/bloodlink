import { randomBytes } from "crypto";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { detectImageType } from "@/lib/uploads";
import { verifyAgent } from "@/lib/jarvis/store";

export async function POST(request: Request) {
  const form = await request.formData();
  const agentId = String(form.get("agentId") ?? "");
  const token = String(form.get("token") ?? "");
  const commandId = String(form.get("commandId") ?? "");
  const file = form.get("photo");

  if (!agentId || !token || !commandId || !(file instanceof File)) {
    return NextResponse.json({ error: "agentId, token, commandId, photo required" }, { status: 400 });
  }

  if (!verifyAgent(agentId, token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = detectImageType(buffer, file.type, file.name);
  if (!detected) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
  }

  const dir = path.join(process.cwd(), "public", "jarvis", "captures");
  mkdirSync(dir, { recursive: true });
  const name = `${commandId}_${randomBytes(4).toString("hex")}.${detected.ext}`;
  const full = path.join(dir, name);
  writeFileSync(full, buffer);

  const url = `/jarvis/captures/${name}`;
  return NextResponse.json({ url });
}

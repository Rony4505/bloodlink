import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentDonor } from "@/lib/auth";
import { recordAppInstall } from "@/lib/db";

const schema = z.object({
  installId: z.string().regex(/^[a-z0-9-]{16,64}$/i),
  source: z.enum(["play", "pwa"]),
});

/** Short, non-identifying device label for the admin list. */
function describeDevice(ua: string): string {
  const os =
    /Android\s([\d.]+)/i.exec(ua)?.[0] ||
    (/iPhone|iPad/i.test(ua) ? "iOS" : /Windows/i.test(ua) ? "Windows" : /Mac OS/i.test(ua) ? "macOS" : "Device");
  const browser = /Chrome\/(\d+)/i.exec(ua)
    ? `Chrome ${/Chrome\/(\d+)/i.exec(ua)![1]}`
    : /Safari/i.test(ua)
      ? "Safari"
      : "";
  return [os.replace(/\s/g, " "), browser].filter(Boolean).join(" · ");
}

/** Called by the client when the site runs as an installed app (TWA referrer / standalone). */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const donor = await getCurrentDonor();
    const ua = request.headers.get("user-agent") || "";
    const result = await recordAppInstall({
      id: parsed.data.installId.toLowerCase(),
      donorId: donor?.id ?? null,
      source: parsed.data.source,
      device: describeDevice(ua),
      userAgent: ua,
    });
    return NextResponse.json({ ok: true, isNew: result.isNew });
  } catch (err) {
    console.error("[bloodlink] app install record failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

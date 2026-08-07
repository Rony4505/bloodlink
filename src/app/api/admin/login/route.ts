import { NextResponse } from "next/server";
import { createAdminSession, verifyAdminLogin } from "@/lib/auth";
import { adminLoginSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = adminLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid login data" }, { status: 400 });
    }

    const ok = await verifyAdminLogin(
      parsed.data.username,
      parsed.data.password,
    );
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 },
      );
    }

    await createAdminSession();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("AUTH_SECRET")) {
      return NextResponse.json(
        {
          error:
            "AUTH_SECRET is missing on the server. Set AUTH_SECRET (16+ chars) in Railway Variables, then redeploy.",
        },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

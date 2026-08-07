import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { verifyAdminLogin } from "@/lib/auth";
import { adminLoginSchema } from "@/lib/validations";

const ADMIN_COOKIE = "bloodlink_admin";
const SESSION_DAYS = 7;

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET must be set (min 16 characters)");
  }
  return new TextEncoder().encode(secret);
}

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

    const token = await new SignJWT({ role: "admin", sub: "owner" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${SESSION_DAYS}d`)
      .sign(getSecret());

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_DAYS * 24 * 60 * 60,
    });
    return response;
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

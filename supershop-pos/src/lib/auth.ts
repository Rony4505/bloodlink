import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { readStore } from "./store";

const COOKIE = "loom_session";

function secretKey() {
  const secret = process.env.AUTH_SECRET || "loom-dev-secret-change-me-32chars!!";
  return new TextEncoder().encode(secret);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const store = await readStore();
  return bcrypt.compare(pin, store.settings.pinHash);
}

export async function createSession(cashier = "Cashier") {
  const token = await new SignJWT({ role: "cashier", cashier })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secretKey());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession(): Promise<{ cashier: string } | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return { cashier: String(payload.cashier || "Cashier") };
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getNextEligibleDate, isDonorAvailable } from "./availability";
import { findDonorById, getAdminSettings, getRatingStats } from "./db";
import type { Donor } from "./types";

const DONOR_COOKIE = "bloodlink_session";
const ADMIN_COOKIE = "bloodlink_admin";
const SESSION_DAYS = 7;

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET must be set (min 16 characters)");
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(donorId: string): Promise<void> {
  const token = await new SignJWT({ sub: donorId, role: "donor" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());

  const jar = await cookies();
  jar.set(DONOR_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(DONOR_COOKIE);
}

export async function getSessionDonorId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(DONOR_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role && payload.role !== "donor") return null;
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function getCurrentDonor(): Promise<Donor | null> {
  const id = await getSessionDonorId();
  if (!id) return null;
  return findDonorById(id);
}

export async function verifyAdminLogin(
  username: string,
  password: string,
): Promise<boolean> {
  const admin = await getAdminSettings();
  if (username.trim().toLowerCase() !== admin.username.toLowerCase()) {
    return false;
  }
  return verifyPassword(password, admin.passwordHash);
}

export async function createAdminSession(): Promise<void> {
  const token = await new SignJWT({ role: "admin", sub: "owner" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearAdminSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export function hashIp(ip: string): string {
  return createHash("sha256")
    .update(`${ip}:${process.env.AUTH_SECRET}`)
    .digest("hex");
}

export function hashCode(code: string): string {
  return createHash("sha256")
    .update(`${code}:${process.env.AUTH_SECRET}`)
    .digest("hex");
}

export async function toSafeDonor(donor: Donor) {
  const available = isDonorAvailable(donor.gender, donor.lastDonationDate);
  const stats = await getRatingStats(donor.id);
  return {
    id: donor.id,
    name: donor.name,
    email: donor.email,
    phone: donor.phone,
    gender: donor.gender,
    bloodGroup: donor.bloodGroup,
    district: donor.district,
    area: donor.area,
    available,
    lastDonationDate: donor.lastDonationDate,
    nextEligibleDate: getNextEligibleDate(donor.gender, donor.lastDonationDate),
    waitDays: donor.gender === "female" ? 120 : 90,
    bloodIssue: donor.bloodIssue || "",
    avgRating: stats.avg,
    ratingCount: stats.count,
    createdAt: donor.createdAt,
    updatedAt: donor.updatedAt,
  };
}

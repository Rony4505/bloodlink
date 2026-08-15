import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getNextEligibleDate, isDonorAvailable } from "./availability";
import {
  findDonorById,
  findVolunteerById,
  getAdminSettings,
  getRatingStats,
  updateAdminSettings,
} from "./db";
import type { Donor, Volunteer } from "./types";

const DONOR_COOKIE = "bloodlink_session";
const ADMIN_COOKIE = "bloodlink_admin";
const VOLUNTEER_COOKIE = "bloodlink_volunteer";
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
  const inputUser = username.trim().toLowerCase();
  const envUser = (process.env.ADMIN_USERNAME || "rony").trim().toLowerCase();
  const envPass = process.env.ADMIN_PASSWORD || "";

  if (inputUser === admin.username.toLowerCase()) {
    if (await verifyPassword(password, admin.passwordHash)) return true;
  }

  // Recover login when env password is correct but stored hash is stale/broken.
  if (
    envPass &&
    password === envPass &&
    (inputUser === envUser || inputUser === admin.username.toLowerCase())
  ) {
    await updateAdminSettings({
      username: process.env.ADMIN_USERNAME || admin.username || "rony",
      passwordHash: await hashPassword(envPass),
    });
    return true;
  }

  return false;
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

export async function createVolunteerSession(volunteerId: string): Promise<void> {
  const token = await new SignJWT({ sub: volunteerId, role: "volunteer" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());

  const jar = await cookies();
  jar.set(VOLUNTEER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearVolunteerSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(VOLUNTEER_COOKIE);
}

export async function getCurrentVolunteer(): Promise<Volunteer | null> {
  const jar = await cookies();
  const token = jar.get(VOLUNTEER_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role !== "volunteer") return null;
    const id = typeof payload.sub === "string" ? payload.sub : null;
    if (!id) return null;
    const volunteer = await findVolunteerById(id);
    if (!volunteer || !volunteer.enabled) return null;
    return volunteer;
  } catch {
    return null;
  }
}

export function toSafeVolunteer(volunteer: Volunteer) {
  return {
    id: volunteer.id,
    name: volunteer.name,
    phone: volunteer.phone,
    email: volunteer.email,
    district: volunteer.district,
    role: volunteer.role,
    notes: volunteer.notes,
    username: volunteer.username,
    enabled: volunteer.enabled,
    createdAt: volunteer.createdAt,
    updatedAt: volunteer.updatedAt,
  };
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

export function makeCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function isDonorVerified(donor: {
  emailVerified?: boolean;
  phoneVerified?: boolean;
}): boolean {
  return Boolean(donor.emailVerified || donor.phoneVerified);
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
    donationCount: Math.max(0, Math.floor(Number(donor.donationCount) || 0)),
    avgRating: stats.avg,
    ratingCount: stats.count,
    emailVerified: Boolean(donor.emailVerified),
    phoneVerified: Boolean(donor.phoneVerified),
    verified: isDonorVerified(donor),
    createdAt: donor.createdAt,
    updatedAt: donor.updatedAt,
  };
}

import { randomUUID } from "crypto";
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import { isDonorAvailable } from "./availability";
import { DEFAULT_PRIVACY_BN, DEFAULT_PRIVACY_EN } from "./defaults";
import type {
  AdminSettings,
  AppNotification,
  BloodPost,
  ContactRequest,
  DatabaseShape,
  Donor,
  Gender,
  Rating,
} from "./types";

const configuredDataDir = process.env.DATA_DIR;
const dataDir = configuredDataDir
  ? path.isAbsolute(configuredDataDir)
    ? configuredDataDir
    : path.join(process.cwd(), configuredDataDir)
  : path.join(process.cwd(), "data");
const dbPath = path.join(/* turbopackIgnore: true */ dataDir, "bloodlink.json");
const tmpPath = path.join(/* turbopackIgnore: true */ dataDir, "bloodlink.tmp.json");

let writeQueue: Promise<void> = Promise.resolve();

function normalizeDonor(raw: Partial<Donor> & { id: string }): Donor {
  const gender: Gender = raw.gender === "female" ? "female" : "male";
  const lastDonationDate = raw.lastDonationDate ?? null;
  return {
    id: raw.id,
    name: raw.name ?? "",
    email: raw.email ?? "",
    phone: raw.phone ?? "",
    passwordHash: raw.passwordHash ?? "",
    gender,
    bloodGroup: raw.bloodGroup ?? "O+",
    district: raw.district ?? "Dhaka",
    area: raw.area ?? "",
    lastDonationDate,
    bloodIssue: raw.bloodIssue ?? "",
    available: isDonorAvailable(gender, lastDonationDate),
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  };
}

async function defaultAdmin(): Promise<AdminSettings> {
  const username = process.env.ADMIN_USERNAME || "rony";
  const password = process.env.ADMIN_PASSWORD || "BloodLink@Owner2026";
  return {
    username,
    passwordHash: await bcrypt.hash(password, 12),
    verifyEmail: "",
    verifyPhone: "",
    emailVerified: false,
    phoneVerified: false,
    pendingEmailCodeHash: null,
    pendingPhoneCodeHash: null,
    privacyBn: DEFAULT_PRIVACY_BN,
    privacyEn: DEFAULT_PRIVACY_EN,
  };
}

async function ensureDb(): Promise<DatabaseShape> {
  await mkdir(dataDir, { recursive: true });
  try {
    const file = await readFile(dbPath, "utf8");
    const parsed = JSON.parse(file) as Partial<DatabaseShape>;
    const needsMigrate =
      !parsed.admin ||
      !parsed.ratings ||
      !parsed.posts ||
      !parsed.notifications;
    const admin = parsed.admin?.passwordHash
      ? {
          ...(await defaultAdmin()),
          ...parsed.admin,
          privacyBn: parsed.admin.privacyBn || DEFAULT_PRIVACY_BN,
          privacyEn: parsed.admin.privacyEn || DEFAULT_PRIVACY_EN,
        }
      : await defaultAdmin();
    const db: DatabaseShape = {
      donors: (parsed.donors ?? []).map((d) => normalizeDonor(d)),
      contactRequests: parsed.contactRequests ?? [],
      ratings: parsed.ratings ?? [],
      posts: (parsed.posts ?? []).map((p) =>
        normalizePost(p as Partial<BloodPost> & { id: string }),
      ),
      notifications: parsed.notifications ?? [],
      admin,
    };
    if (needsMigrate) await persist(db);
    return db;
  } catch {
    const empty: DatabaseShape = {
      donors: [],
      contactRequests: [],
      ratings: [],
      posts: [],
      notifications: [],
      admin: await defaultAdmin(),
    };
    await writeFile(dbPath, JSON.stringify(empty, null, 2), "utf8");
    return empty;
  }
}

async function persist(db: DatabaseShape): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  await writeFile(tmpPath, JSON.stringify(db, null, 2), "utf8");
  await rename(tmpPath, dbPath);
}

function withWrite<T>(fn: (db: DatabaseShape) => Promise<T> | T): Promise<T> {
  const run = writeQueue.then(async () => {
    const db = await ensureDb();
    return fn(db);
  });
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function listDonors(): Promise<Donor[]> {
  const db = await ensureDb();
  return db.donors.map((d) => normalizeDonor(d));
}

export async function listContactRequests(): Promise<ContactRequest[]> {
  const db = await ensureDb();
  return [...db.contactRequests].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function findDonorByEmail(email: string): Promise<Donor | null> {
  const db = await ensureDb();
  const donor = db.donors.find(
    (d) => d.email.toLowerCase() === email.toLowerCase(),
  );
  return donor ? normalizeDonor(donor) : null;
}

export async function findDonorById(id: string): Promise<Donor | null> {
  const db = await ensureDb();
  const donor = db.donors.find((d) => d.id === id);
  return donor ? normalizeDonor(donor) : null;
}

export async function createDonor(
  input: Omit<Donor, "id" | "createdAt" | "updatedAt" | "available">,
): Promise<Donor> {
  return withWrite(async (db) => {
    const now = new Date().toISOString();
    const donor = normalizeDonor({
      ...input,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
    db.donors.push(donor);
    await persist(db);
    return donor;
  });
}

export async function updateDonor(
  id: string,
  patch: Partial<
    Pick<
      Donor,
      | "name"
      | "phone"
      | "gender"
      | "bloodGroup"
      | "district"
      | "area"
      | "lastDonationDate"
      | "bloodIssue"
    >
  >,
): Promise<Donor | null> {
  return withWrite(async (db) => {
    const index = db.donors.findIndex((d) => d.id === id);
    if (index === -1) return null;
    const merged = normalizeDonor({
      ...db.donors[index],
      ...patch,
      updatedAt: new Date().toISOString(),
    });
    db.donors[index] = merged;
    await persist(db);
    return merged;
  });
}

export async function deleteDonor(id: string): Promise<boolean> {
  return withWrite(async (db) => {
    const before = db.donors.length;
    db.donors = db.donors.filter((d) => d.id !== id);
    db.contactRequests = db.contactRequests.filter((r) => r.donorId !== id);
    db.ratings = db.ratings.filter((r) => r.donorId !== id);
    db.notifications = db.notifications.filter((n) => n.userId !== id);
    if (db.donors.length === before) return false;
    await persist(db);
    return true;
  });
}

export async function createContactRequest(
  input: Omit<ContactRequest, "id" | "createdAt">,
): Promise<ContactRequest> {
  return withWrite(async (db) => {
    const request: ContactRequest = {
      ...input,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    db.contactRequests.push(request);
    await persist(db);
    return request;
  });
}

export async function countRecentContactRequests(
  ipHash: string,
  withinMs: number,
): Promise<number> {
  const db = await ensureDb();
  const cutoff = Date.now() - withinMs;
  return db.contactRequests.filter(
    (r) => r.ipHash === ipHash && new Date(r.createdAt).getTime() >= cutoff,
  ).length;
}

export async function listRatingsForDonor(donorId: string): Promise<Rating[]> {
  const db = await ensureDb();
  return db.ratings
    .filter((r) => r.donorId === donorId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function getRatingStats(
  donorId: string,
): Promise<{ avg: number | null; count: number }> {
  const ratings = await listRatingsForDonor(donorId);
  if (!ratings.length) return { avg: null, count: 0 };
  const avg =
    ratings.reduce((sum, r) => sum + r.stars, 0) / Math.max(ratings.length, 1);
  return { avg: Math.round(avg * 10) / 10, count: ratings.length };
}

export async function createRating(
  input: Omit<Rating, "id" | "createdAt">,
): Promise<Rating> {
  return withWrite(async (db) => {
    const rating: Rating = {
      ...input,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    db.ratings.push(rating);
    await persist(db);
    return rating;
  });
}

function normalizePost(raw: Partial<BloodPost> & { id: string }): BloodPost {
  return {
    id: raw.id,
    posterName: raw.posterName ?? "",
    posterPhone: raw.posterPhone ?? "",
    patientName: raw.patientName || raw.posterName || "",
    relation: raw.relation || "Self / Family",
    bloodGroup: raw.bloodGroup ?? "O+",
    unitsNeeded: raw.unitsNeeded ?? 1,
    district: raw.district ?? "Dhaka",
    area: raw.area || "",
    hospital: raw.hospital ?? "",
    neededBy: raw.neededBy || raw.createdAt?.slice(0, 10) || "",
    message: raw.message ?? "",
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
}

export async function listPosts(): Promise<BloodPost[]> {
  const db = await ensureDb();
  return db.posts
    .map((p) => normalizePost(p))
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function findPostById(id: string): Promise<BloodPost | null> {
  const db = await ensureDb();
  const post = db.posts.find((p) => p.id === id);
  return post ? normalizePost(post) : null;
}

export async function createPost(
  input: Omit<BloodPost, "id" | "createdAt">,
): Promise<BloodPost> {
  return withWrite(async (db) => {
    const post = normalizePost({
      ...input,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    });
    db.posts.push(post);

    const title = `Blood needed: ${post.bloodGroup}`;
    const body = `${post.patientName} needs ${post.unitsNeeded} bag(s) of ${post.bloodGroup} at ${post.hospital}, ${post.area}, ${post.district}. Needed by ${post.neededBy}.`;
    for (const donor of db.donors) {
      db.notifications.push({
        id: randomUUID(),
        userId: donor.id,
        title,
        body,
        type: "blood_request",
        href: `/requests/${post.id}`,
        postId: post.id,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    await persist(db);
    return post;
  });
}

export async function listNotifications(
  userId: string,
): Promise<AppNotification[]> {
  const db = await ensureDb();
  return db.notifications
    .filter((n) => n.userId === userId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function markNotificationRead(
  userId: string,
  id: string,
): Promise<boolean> {
  return withWrite(async (db) => {
    const item = db.notifications.find((n) => n.id === id && n.userId === userId);
    if (!item) return false;
    item.read = true;
    await persist(db);
    return true;
  });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  return withWrite(async (db) => {
    for (const n of db.notifications) {
      if (n.userId === userId) n.read = true;
    }
    await persist(db);
  });
}

export async function createDailyRemindersIfNeeded(
  todayKey: string,
): Promise<number> {
  return withWrite(async (db) => {
    let created = 0;
    for (const donor of db.donors) {
      const already = db.notifications.some(
        (n) =>
          n.userId === donor.id &&
          n.type === "daily_update" &&
          n.createdAt.startsWith(todayKey),
      );
      if (already) continue;
      db.notifications.push({
        id: randomUUID(),
        userId: donor.id,
        title: "Update your donation status",
        body: "If you donated blood, please update your last donation date now so seekers get accurate availability.",
        type: "daily_update",
        href: "/dashboard",
        read: false,
        createdAt: new Date().toISOString(),
      });
      created += 1;
    }
    if (created) await persist(db);
    return created;
  });
}

export async function getAdminSettings(): Promise<AdminSettings> {
  const db = await ensureDb();
  return db.admin;
}

export async function updateAdminSettings(
  patch: Partial<AdminSettings>,
): Promise<AdminSettings> {
  return withWrite(async (db) => {
    db.admin = { ...db.admin, ...patch };
    await persist(db);
    return db.admin;
  });
}

export async function getPrivacyContent(): Promise<{
  bn: string;
  en: string;
}> {
  const admin = await getAdminSettings();
  return { bn: admin.privacyBn, en: admin.privacyEn };
}

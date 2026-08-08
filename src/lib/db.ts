import { randomUUID } from "crypto";
import { access, copyFile, mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import { isDonorAvailable } from "./availability";
import { DEFAULT_PRIVACY_BN, DEFAULT_PRIVACY_EN } from "./defaults";
import {
  bloodRequestTexts,
  contactChangeResultTexts,
  dailyReminderTexts,
  withBilingual,
} from "./notification-text";
import {
  hasDatabaseUrl,
  listDbEnvKeys,
  loadDbFromPostgres,
  postgresHealth,
  saveDbToPostgres,
} from "./pg-store";
import {
  isRailwayRuntime,
  runtimeDbFlag,
  runtimeEnv,
  runtimeVolumeMountPath,
} from "./runtime-env";
import type {
  AdminSettings,
  AppNotification,
  BloodPost,
  ContactChangeRequest,
  ContactRequest,
  DatabaseShape,
  Donor,
  Gender,
  Rating,
} from "./types";

export const STORAGE_NOT_DURABLE = "STORAGE_NOT_DURABLE";

function resolveDataDir(): string {
  // Prefer an attached Railway volume — it survives redeploys; /app/data alone does not.
  const volume = runtimeVolumeMountPath();
  if (volume) {
    return path.isAbsolute(volume)
      ? volume
      : path.join(/* turbopackIgnore: true */ process.cwd(), volume);
  }

  const configuredDataDir = runtimeEnv("DATA_DIR") || process.env.DATA_DIR || "";
  if (configuredDataDir) {
    return path.isAbsolute(configuredDataDir)
      ? configuredDataDir
      : path.join(/* turbopackIgnore: true */ process.cwd(), configuredDataDir);
  }
  return path.join(/* turbopackIgnore: true */ process.cwd(), "data");
}

const dataDir = resolveDataDir();
const dbPath = path.join(/* turbopackIgnore: true */ dataDir, "bloodlink.json");
const bakPath = path.join(/* turbopackIgnore: true */ dataDir, "bloodlink.bak.json");
const tmpPath = path.join(/* turbopackIgnore: true */ dataDir, "bloodlink.tmp.json");

let writeQueue: Promise<void> = Promise.resolve();
let loggedStoragePath = false;

/** Durable enough that redeploying the website will not erase donors. */
export function storageIsDurable(): boolean {
  if (hasDatabaseUrl()) return true;
  if (runtimeVolumeMountPath()) return true;
  // Local/dev file storage is fine; Railway ephemeral disk is not.
  return !isRailwayRuntime();
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

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

function shapeFromParsed(parsed: Partial<DatabaseShape>, admin: AdminSettings): DatabaseShape {
  return {
    donors: (parsed.donors ?? []).map((d) => normalizeDonor(d)),
    contactRequests: parsed.contactRequests ?? [],
    contactChangeRequests: parsed.contactChangeRequests ?? [],
    ratings: parsed.ratings ?? [],
    posts: (parsed.posts ?? []).map((p) =>
      normalizePost(p as Partial<BloodPost> & { id: string }),
    ),
    notifications: parsed.notifications ?? [],
    admin,
  };
}

async function resolveAdmin(parsed: Partial<DatabaseShape>): Promise<{
  admin: AdminSettings;
  needsMigrate: boolean;
}> {
  const needsMigrate =
    !parsed.admin ||
    !parsed.ratings ||
    !parsed.posts ||
    !parsed.notifications ||
    !parsed.contactChangeRequests;
  const admin = parsed.admin?.passwordHash
    ? {
        ...(await defaultAdmin()),
        ...parsed.admin,
        privacyBn: parsed.admin.privacyBn || DEFAULT_PRIVACY_BN,
        privacyEn: parsed.admin.privacyEn || DEFAULT_PRIVACY_EN,
      }
    : await defaultAdmin();
  return { admin, needsMigrate };
}

async function loadDbFromFile(
  filePath: string,
): Promise<{ db: DatabaseShape; needsMigrate: boolean } | null> {
  try {
    const file = await readFile(filePath, "utf8");
    if (!file.trim()) return null;
    const parsed = JSON.parse(file) as Partial<DatabaseShape>;
    if (!parsed || typeof parsed !== "object") return null;
    const { admin, needsMigrate } = await resolveAdmin(parsed);
    return { db: shapeFromParsed(parsed, admin), needsMigrate };
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code !== "ENOENT") {
      console.error(`[bloodlink] Failed reading ${filePath}:`, err);
    }
    return null;
  }
}

async function createEmptyDb(): Promise<DatabaseShape> {
  return {
    donors: [],
    contactRequests: [],
    contactChangeRequests: [],
    ratings: [],
    posts: [],
    notifications: [],
    admin: await defaultAdmin(),
  };
}

async function hydrateParsed(
  raw: Partial<DatabaseShape>,
): Promise<{ db: DatabaseShape; needsMigrate: boolean }> {
  const { admin, needsMigrate } = await resolveAdmin(raw);
  return { db: shapeFromParsed(raw, admin), needsMigrate };
}

type PersistOptions = { allowEmptyDonors?: boolean; createIfMissing?: boolean };

/** Load existing store without creating/seeding an empty database. */
async function loadExistingDb(): Promise<DatabaseShape | null> {
  if (hasDatabaseUrl()) {
    const raw = await loadDbFromPostgres();
    if (raw) {
      const hydrated = await hydrateParsed(raw);
      return hydrated.db;
    }
    const fromFile = await loadDbFromFile(dbPath);
    return fromFile?.db ?? null;
  }

  await mkdir(dataDir, { recursive: true });
  const primary = await loadDbFromFile(dbPath);
  if (primary) return primary.db;
  const backup = await loadDbFromFile(bakPath);
  return backup?.db ?? null;
}

async function ensureDb(options: { createIfMissing?: boolean } = {}): Promise<DatabaseShape> {
  const createIfMissing = options.createIfMissing ?? false;

  if (!loggedStoragePath) {
    loggedStoragePath = true;
    const durable = storageIsDurable();
    console.info(
      `[bloodlink] Storage backend: ${hasDatabaseUrl() ? "postgres" : "file"} (${hasDatabaseUrl() ? "DATABASE_URL" : dbPath}) durable=${durable}`,
    );
    if (!durable) {
      console.error(
        "[bloodlink] WARNING: storage is NOT durable. Website redeploys will erase donors. Link Railway Postgres (DATABASE_URL) or attach a volume.",
      );
    }
  }

  if (hasDatabaseUrl()) {
    try {
      const raw = await loadDbFromPostgres();
      if (raw) {
        // Apply in-memory migrations only — do not persist on the read path
        // (avoids racing with writes and seeding empty overwrites).
        const hydrated = await hydrateParsed(raw);
        return hydrated.db;
      }

      // One-time migrate from local/volume file if Postgres row is missing.
      // Only persist during write flows so health/read paths cannot race.
      const fromFile = await loadDbFromFile(dbPath);
      if (fromFile) {
        if (createIfMissing) {
          console.info("[bloodlink] Migrating file database into Postgres");
          await persist(fromFile.db);
        }
        return fromFile.db;
      }

      if (!createIfMissing) {
        return createEmptyDb();
      }

      // Return in-memory empty only — first mutation persists real data.
      // Avoids seeding an empty Postgres row that later blocks file migration.
      console.info("[bloodlink] Initializing new empty Postgres database in memory");
      return createEmptyDb();
    } catch (err) {
      console.error("[bloodlink] Postgres storage failed:", err);
      throw err;
    }
  }

  await mkdir(dataDir, { recursive: true });

  const primary = await loadDbFromFile(dbPath);
  if (primary) {
    return primary.db;
  }

  const backup = await loadDbFromFile(bakPath);
  if (backup) {
    console.warn("[bloodlink] Primary DB missing/corrupt — restored from backup");
    await persist(backup.db);
    return backup.db;
  }

  const mainExists = await fileExists(dbPath);
  const bakExists = await fileExists(bakPath);
  if (mainExists || bakExists) {
    throw new Error(
      `[bloodlink] Database file exists but could not be read. Refusing to wipe. Path: ${dbPath}`,
    );
  }

  if (!createIfMissing) {
    return createEmptyDb();
  }

  console.info("[bloodlink] Initializing new empty file database in memory");
  return createEmptyDb();
}

async function persist(
  db: DatabaseShape,
  options: PersistOptions = {},
): Promise<void> {
  if (hasDatabaseUrl()) {
    await saveDbToPostgres(db, { allowEmptyDonors: options.allowEmptyDonors });
    return;
  }

  await mkdir(dataDir, { recursive: true });

  if (!options.allowEmptyDonors && db.donors.length === 0) {
    const existing =
      (await loadDbFromFile(dbPath)) || (await loadDbFromFile(bakPath));
    if (existing && existing.db.donors.length > 0) {
      throw new Error(
        `[bloodlink] Refusing to overwrite file store with empty donor list (${existing.db.donors.length} donors kept)`,
      );
    }
  }

  if (await fileExists(dbPath)) {
    try {
      await copyFile(dbPath, bakPath);
    } catch (err) {
      console.error("[bloodlink] Backup copy failed:", err);
    }
  }
  await writeFile(tmpPath, JSON.stringify(db, null, 2), "utf8");
  await rename(tmpPath, dbPath);
}

export async function getStorageHealth() {
  let donorCount = 0;
  let readable = false;
  let error: string | null = null;
  const usingPostgres = hasDatabaseUrl();
  const volumeMount = runtimeVolumeMountPath();
  const durable = storageIsDurable();
  let mainExists = false;
  let bakExists = false;
  let pgOk: boolean | null = null;

  if (usingPostgres) {
    const health = await postgresHealth();
    pgOk = health.ok;
    if (!health.ok) error = health.error;
  } else {
    await mkdir(dataDir, { recursive: true });
    mainExists = await fileExists(dbPath);
    bakExists = await fileExists(bakPath);
  }

  try {
    // Never seed/persist an empty DB from health checks — that can wipe donors.
    const db = await loadExistingDb();
    donorCount = db?.donors.length ?? 0;
    readable = true;
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown storage error";
  }

  const entrypointFlag = runtimeDbFlag();
  const onRailway = isRailwayRuntime();

  let persistentHint: string;
  if (usingPostgres) {
    persistentHint =
      "Postgres is active — donor data survives website edits/redeploys";
  } else if (volumeMount) {
    persistentHint =
      "Railway volume is mounted for file storage. Prefer linking Postgres (DATABASE_URL) for the safest setup.";
  } else if (onRailway || entrypointFlag === "0") {
    persistentHint =
      "CRITICAL: Railway has no DATABASE_URL on bloodlink. Editing/redeploying the website wipes all donors. Create Postgres → Add Variable Reference DATABASE_URL on bloodlink → Deploy.";
  } else {
    persistentHint =
      "File storage only. Set DATABASE_URL for production so donor data survives deploys.";
  }

  return {
    ok: readable && (pgOk ?? true),
    durable,
    backend: usingPostgres ? "postgres" : "file",
    databaseUrlSet: usingPostgres,
    entrypointDbFlag: entrypointFlag,
    volumeMounted: Boolean(volumeMount),
    volumeMountPath: volumeMount || null,
    onRailway,
    dbEnvKeys: listDbEnvKeys(),
    dataDir,
    dbPath,
    mainExists,
    bakExists,
    postgresOk: pgOk,
    donorCount,
    persistentHint,
    error,
  };
}

function withWrite<T>(fn: (db: DatabaseShape) => Promise<T> | T): Promise<T> {
  const run = writeQueue.then(async () => {
    // Only mutations may create/seed a brand-new empty store.
    const db = await ensureDb({ createIfMissing: true });
    return fn(db);
  });
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function assertDurableStorage(): void {
  if (!storageIsDurable()) {
    throw new Error(STORAGE_NOT_DURABLE);
  }
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
  assertDurableStorage();
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
      | "email"
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
    db.contactChangeRequests = db.contactChangeRequests.filter(
      (r) => r.donorId !== id,
    );
    db.ratings = db.ratings.filter((r) => r.donorId !== id);
    db.notifications = db.notifications.filter((n) => n.userId !== id);
    if (db.donors.length === before) return false;
    // Allow persisting zero donors when the last donor was intentionally deleted.
    await persist(db, { allowEmptyDonors: true });
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

    const texts = withBilingual(bloodRequestTexts(post));
    for (const donor of db.donors) {
      db.notifications.push({
        id: randomUUID(),
        userId: donor.id,
        ...texts,
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
      const texts = withBilingual(dailyReminderTexts());
      db.notifications.push({
        id: randomUUID(),
        userId: donor.id,
        ...texts,
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

export async function listContactChangeRequests(): Promise<ContactChangeRequest[]> {
  const db = await ensureDb();
  return [...db.contactChangeRequests].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getPendingContactChange(
  donorId: string,
): Promise<ContactChangeRequest | null> {
  const db = await ensureDb();
  return (
    db.contactChangeRequests.find(
      (r) => r.donorId === donorId && r.status === "pending",
    ) || null
  );
}

export async function createContactChangeRequest(input: {
  donorId: string;
  currentEmail: string;
  currentPhone: string;
  requestedEmail: string | null;
  requestedPhone: string | null;
  note: string;
}): Promise<ContactChangeRequest> {
  return withWrite(async (db) => {
    const existing = db.contactChangeRequests.find(
      (r) => r.donorId === input.donorId && r.status === "pending",
    );
    if (existing) {
      throw new Error("PENDING_EXISTS");
    }
    if (input.requestedEmail) {
      const taken = db.donors.some(
        (d) =>
          d.id !== input.donorId &&
          d.email.toLowerCase() === input.requestedEmail!.toLowerCase(),
      );
      if (taken) throw new Error("EMAIL_TAKEN");
    }
    const request: ContactChangeRequest = {
      id: randomUUID(),
      donorId: input.donorId,
      currentEmail: input.currentEmail,
      currentPhone: input.currentPhone,
      requestedEmail: input.requestedEmail,
      requestedPhone: input.requestedPhone,
      note: input.note,
      status: "pending",
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    };
    db.contactChangeRequests.push(request);
    await persist(db);
    return request;
  });
}

export async function resolveContactChangeRequest(
  id: string,
  decision: "approved" | "rejected",
): Promise<ContactChangeRequest | null> {
  return withWrite(async (db) => {
    const request = db.contactChangeRequests.find((r) => r.id === id);
    if (!request || request.status !== "pending") return null;

    request.status = decision;
    request.resolvedAt = new Date().toISOString();

    if (decision === "approved") {
      const index = db.donors.findIndex((d) => d.id === request.donorId);
      if (index === -1) return null;
      if (request.requestedEmail) {
        const taken = db.donors.some(
          (d) =>
            d.id !== request.donorId &&
            d.email.toLowerCase() === request.requestedEmail!.toLowerCase(),
        );
        if (taken) throw new Error("EMAIL_TAKEN");
      }
      db.donors[index] = normalizeDonor({
        ...db.donors[index],
        email: request.requestedEmail || db.donors[index].email,
        phone: request.requestedPhone || db.donors[index].phone,
        updatedAt: new Date().toISOString(),
      });
    }

    const texts = withBilingual(contactChangeResultTexts(decision === "approved"));
    db.notifications.push({
      id: randomUUID(),
      userId: request.donorId,
      ...texts,
      type: "contact_change",
      href: "/dashboard",
      read: false,
      createdAt: new Date().toISOString(),
    });

    await persist(db);
    return request;
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

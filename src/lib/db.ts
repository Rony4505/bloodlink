import { randomBytes, randomUUID } from "crypto";
import {
  access,
  copyFile,
  mkdir,
  readdir,
  readFile,
  rename,
  stat,
  unlink,
  writeFile,
} from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import { isDonorAvailable } from "./availability";
import { DEFAULT_PRIVACY_BN, DEFAULT_PRIVACY_EN } from "./defaults";
import { ADMIN_NOTIFY_USER_ID } from "./admin-notify-user";
import {
  bloodRequestTexts,
  contactChangeResultTexts,
  dailyReminderTexts,
  goldBlessingTexts,
  newDonorAdminTexts,
  withBilingual,
} from "./notification-text";
import {
  looksLikeRandomPortalToken,
  uniqueSlug,
} from "./url-slug";
import {
  bangladeshDateKey,
  bangladeshHour,
  daysBetweenDateKeys,
  defaultNotificationSettings,
  normalizeNotificationSettings,
} from "./notification-settings";
import {
  hasDatabaseUrl,
  listDbEnvKeys,
  loadDbFromPostgres,
  postgresHealth,
  saveDbToPostgres,
} from "./pg-store";
import {
  clearBrokenPrivateDatabaseUrl,
  runtimeDbFlag,
} from "./runtime-env";
import {
  defaultSiteAppearance,
  DEFAULT_BANNER_SLIDE_INTERVAL_SEC,
  normalizeBanner,
  normalizeBannerSlideIntervalSec,
  normalizeSiteAppearance,
} from "./site-cms";
import type {
  AdminSettings,
  AppNotification,
  BloodPost,
  ContactChangeRequest,
  ContactRequest,
  DatabaseShape,
  Donor,
  Gender,
  PendingRegistration,
  PendingSuccessStory,
  PlatformOptions,
  PostUrgency,
  PushSubscriptionRecord,
  Rating,
  VerifyChannel,
  Volunteer,
  VolunteerActivity,
  VolunteerActivityStatus,
} from "./types";
import { POST_URGENCIES, resolvePostUrgency } from "./post-urgency";
import { normalizePhone } from "./privacy";
import {
  donorPushStatusFromSubscriptions,
  isDeliverablePushSubscription,
  isPermissionOnlyPushSubscription,
} from "./push-subscription";

function defaultPlatformOptions(): PlatformOptions {
  return {
    hospitalAccess: { enabled: false, notes: "" },
    orgAds: { enabled: false, notes: "" },
    futureServices: { enabled: false, notes: "" },
  };
}

function normalizeBanners(raw: unknown): import("./types").OrgBanner[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) =>
      normalizeBanner(item as Partial<import("./types").OrgBanner>),
    )
    .filter(Boolean) as import("./types").OrgBanner[];
}

function normalizePlatformOptions(
  raw?: Partial<PlatformOptions> | null,
): PlatformOptions {
  const base = defaultPlatformOptions();
  return {
    hospitalAccess: {
      enabled: Boolean(raw?.hospitalAccess?.enabled),
      notes: raw?.hospitalAccess?.notes?.trim() || "",
    },
    orgAds: {
      enabled: Boolean(raw?.orgAds?.enabled),
      notes: raw?.orgAds?.notes?.trim() || "",
    },
    futureServices: {
      enabled: Boolean(raw?.futureServices?.enabled),
      notes: raw?.futureServices?.notes?.trim() || "",
    },
  };
}

const configuredDataDir = process.env.DATA_DIR;
const dataDir = configuredDataDir
  ? path.isAbsolute(configuredDataDir)
    ? configuredDataDir
    : path.join(/* turbopackIgnore: true */ process.cwd(), configuredDataDir)
  : path.join(/* turbopackIgnore: true */ process.cwd(), "data");
const dbPath = path.join(/* turbopackIgnore: true */ dataDir, "bloodlink.json");
const bakPath = path.join(/* turbopackIgnore: true */ dataDir, "bloodlink.bak.json");
const tmpPath = path.join(/* turbopackIgnore: true */ dataDir, "bloodlink.tmp.json");
const backupsDir = path.join(/* turbopackIgnore: true */ dataDir, "backups");
const MAX_ROTATING_BACKUPS = 30;
const ROTATING_BACKUP_INTERVAL_MS = 6 * 60 * 60 * 1000;

let writeQueue: Promise<void> = Promise.resolve();
let loggedStoragePath = false;
let lastRotatingBackupAt = 0;
let memoryDb: DatabaseShape | null = null;
let memoryDbAt = 0;
let loadingDb: Promise<DatabaseShape> | null = null;
/** Keep DB in RAM so homepage APIs do not hit Postgres on every request. */
const MEMORY_TTL_MS = 20_000;

function rememberDb(db: DatabaseShape): DatabaseShape {
  memoryDb = db;
  memoryDbAt = Date.now();
  return db;
}

export function clearDbMemoryCache(): void {
  memoryDb = null;
  memoryDbAt = 0;
  loadingDb = null;
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
    donationCount: Math.max(
      0,
      Math.floor(
        Number(
          raw.donationCount ??
            (lastDonationDate ? 1 : 0),
        ) || 0,
      ),
    ),
    bloodIssue: raw.bloodIssue ?? "",
    emailVerified: Boolean(raw.emailVerified),
    phoneVerified: Boolean(raw.phoneVerified),
    pendingEmailCodeHash: raw.pendingEmailCodeHash ?? null,
    pendingPhoneCodeHash: raw.pendingPhoneCodeHash ?? null,
    pendingResetCodeHash: raw.pendingResetCodeHash ?? null,
    pendingResetChannel: (raw.pendingResetChannel as VerifyChannel | null) ?? null,
    pendingResetExpiresAt: raw.pendingResetExpiresAt ?? null,
    createdByVolunteerId: raw.createdByVolunteerId
      ? String(raw.createdByVolunteerId)
      : null,
    volunteerSource:
      raw.volunteerSource === "link" || raw.volunteerSource === "manual"
        ? raw.volunteerSource
        : null,
    volunteerApproved:
      raw.volunteerApproved !== undefined
        ? Boolean(raw.volunteerApproved)
        : raw.createdByVolunteerId
          ? raw.volunteerSource === "link"
          : true,
    available: isDonorAvailable(gender, lastDonationDate),
    lastLoginAt: raw.lastLoginAt ? String(raw.lastLoginAt) : null,
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
    platformOptions: defaultPlatformOptions(),
    notificationSettings: defaultNotificationSettings(),
    banners: [],
    bannerSlideIntervalSec: DEFAULT_BANNER_SLIDE_INTERVAL_SEC,
    siteAppearance: defaultSiteAppearance(),
    vapidPublicKey: "",
    vapidPrivateKey: "",
  };
}

function normalizePendingRegistration(
  raw: Partial<PendingRegistration> | null | undefined,
): PendingRegistration | null {
  if (!raw?.id || !raw.email || !raw.phone || !raw.passwordHash) return null;
  return {
    id: String(raw.id),
    name: String(raw.name || ""),
    email: String(raw.email).toLowerCase(),
    phone: String(raw.phone),
    passwordHash: String(raw.passwordHash),
    gender: raw.gender === "female" ? "female" : "male",
    bloodGroup: raw.bloodGroup || "O+",
    district: String(raw.district || "Dhaka"),
    area: String(raw.area || ""),
    lastDonationDate: raw.lastDonationDate ?? null,
    donationCount: Math.max(
      0,
      Math.floor(
        Number(
          raw.donationCount ??
            (raw.lastDonationDate ? 1 : 0),
        ) || 0,
      ),
    ),
    bloodIssue: String(raw.bloodIssue || ""),
    emailCodeHash: String(raw.emailCodeHash || ""),
    phoneCodeHash: String(raw.phoneCodeHash || ""),
    emailConfirmed: Boolean(raw.emailConfirmed),
    phoneConfirmed: Boolean(raw.phoneConfirmed),
    createdByVolunteerId: raw.createdByVolunteerId
      ? String(raw.createdByVolunteerId)
      : null,
    expiresAt: String(raw.expiresAt || ""),
    createdAt: String(raw.createdAt || new Date().toISOString()),
  };
}

function normalizePendingSuccessStory(
  raw: Partial<PendingSuccessStory> | null | undefined,
): PendingSuccessStory | null {
  if (!raw?.id || !raw.name) return null;
  const quoteEn = String(raw.quoteEn || "").trim();
  const quoteBn = String(raw.quoteBn || "").trim();
  if (!quoteEn && !quoteBn) return null;
  return {
    id: String(raw.id),
    name: String(raw.name).trim(),
    handle: String(raw.handle || "").trim(),
    quoteEn,
    quoteBn,
    createdAt: String(raw.createdAt || new Date().toISOString()),
  };
}

function newVolunteerLinkToken(name: string, taken: Iterable<string>): string {
  return uniqueSlug(name || "volunteer", taken);
}

function normalizeVolunteer(
  raw: Partial<Volunteer> | null | undefined,
): Volunteer | null {
  if (!raw?.id || !raw.name) return null;
  return {
    id: String(raw.id),
    name: String(raw.name).trim(),
    phone: String(raw.phone || "").trim(),
    email: String(raw.email || "").trim().toLowerCase(),
    district: String(raw.district || "").trim(),
    role: String(raw.role || "").trim(),
    notes: String(raw.notes || "").trim(),
    username: String(raw.username || "").trim().toLowerCase(),
    passwordHash: String(raw.passwordHash || ""),
    enabled: raw.enabled !== false,
    linkToken:
      String(raw.linkToken || "").trim() ||
      newVolunteerLinkToken(String(raw.name || "volunteer"), []),
    notificationsEnabled: raw.notificationsEnabled !== false,
    createdAt: String(raw.createdAt || new Date().toISOString()),
    updatedAt: String(raw.updatedAt || raw.createdAt || new Date().toISOString()),
  };
}

function normalizeVolunteerActivity(
  raw: Partial<VolunteerActivity> | null | undefined,
): VolunteerActivity | null {
  if (!raw?.id || !raw.volunteerId || !raw.title) return null;
  const status: VolunteerActivityStatus =
    raw.status === "planned" ||
    raw.status === "in_progress" ||
    raw.status === "done"
      ? raw.status
      : "planned";
  return {
    id: String(raw.id),
    volunteerId: String(raw.volunteerId),
    title: String(raw.title).trim(),
    description: String(raw.description || "").trim(),
    activityType: String(raw.activityType || "other").trim() || "other",
    status,
    activityDate: String(raw.activityDate || "").slice(0, 10),
    volunteerNote: String(raw.volunteerNote || "").trim(),
    createdAt: String(raw.createdAt || new Date().toISOString()),
    updatedAt: String(raw.updatedAt || raw.createdAt || new Date().toISOString()),
  };
}

function normalizeContactRequest(
  raw: Partial<ContactRequest> | null | undefined,
): ContactRequest | null {
  if (!raw?.id || !raw.seekerName || !raw.seekerPhone) return null;
  const kind =
    raw.kind === "post_phone"
      ? "post_phone"
      : "donor_phone";
  return {
    id: String(raw.id),
    kind,
    donorId: raw.donorId ? String(raw.donorId) : null,
    postId: raw.postId ? String(raw.postId) : null,
    seekerName: String(raw.seekerName).trim(),
    seekerPhone: String(raw.seekerPhone).trim(),
    hospital: String(raw.hospital || "").trim(),
    seekerUserId: raw.seekerUserId ? String(raw.seekerUserId) : null,
    auditCode: String(raw.auditCode || "").trim().slice(0, 16),
    targetName: String(raw.targetName || "").trim(),
    targetPhone: String(raw.targetPhone || "").trim(),
    targetBloodGroup: String(raw.targetBloodGroup || "").trim(),
    targetDistrict: String(raw.targetDistrict || "").trim(),
    targetArea: String(raw.targetArea || "").trim(),
    contextNote: String(raw.contextNote || "").trim().slice(0, 240),
    createdAt: String(raw.createdAt || new Date().toISOString()),
    ipHash: String(raw.ipHash || ""),
  };
}

export function toPublicVolunteer(v: Volunteer) {
  return {
    id: v.id,
    name: v.name,
    phone: v.phone,
    email: v.email,
    district: v.district,
    role: v.role,
    notes: v.notes,
    username: v.username,
    hasLogin: Boolean(v.username && v.passwordHash),
    enabled: v.enabled,
    linkToken: v.linkToken,
    notificationsEnabled: v.notificationsEnabled,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  };
}

function shapeFromParsed(parsed: Partial<DatabaseShape>, admin: AdminSettings): DatabaseShape {
  return {
    donors: (parsed.donors ?? []).map((d) => normalizeDonor(d)),
    contactRequests: (parsed.contactRequests ?? [])
      .map((r) => normalizeContactRequest(r))
      .filter(Boolean) as ContactRequest[],
    contactChangeRequests: parsed.contactChangeRequests ?? [],
    ratings: parsed.ratings ?? [],
    posts: (parsed.posts ?? []).map((p) =>
      normalizePost(p as Partial<BloodPost> & { id: string }),
    ),
    notifications: parsed.notifications ?? [],
    pushSubscriptions: Array.isArray(parsed.pushSubscriptions)
      ? parsed.pushSubscriptions
      : [],
    pendingRegistrations: (parsed.pendingRegistrations ?? [])
      .map((p) => normalizePendingRegistration(p))
      .filter(Boolean) as PendingRegistration[],
    pendingSuccessStories: (parsed.pendingSuccessStories ?? [])
      .map((s) => normalizePendingSuccessStory(s))
      .filter(Boolean) as PendingSuccessStory[],
    volunteers: (parsed.volunteers ?? [])
      .map((v) => normalizeVolunteer(v))
      .filter(Boolean) as Volunteer[],
    volunteerActivities: (parsed.volunteerActivities ?? [])
      .map((a) => normalizeVolunteerActivity(a))
      .filter(Boolean) as VolunteerActivity[],
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
    !parsed.contactChangeRequests ||
    !parsed.admin?.platformOptions ||
    !Array.isArray(parsed.admin?.banners) ||
    !parsed.admin?.siteAppearance;
  const admin = parsed.admin?.passwordHash
    ? {
        ...(await defaultAdmin()),
        ...parsed.admin,
        privacyBn: parsed.admin.privacyBn || DEFAULT_PRIVACY_BN,
        privacyEn: parsed.admin.privacyEn || DEFAULT_PRIVACY_EN,
        platformOptions: normalizePlatformOptions(parsed.admin.platformOptions),
        notificationSettings: normalizeNotificationSettings(
          parsed.admin.notificationSettings,
        ),
        banners: normalizeBanners(parsed.admin.banners),
        bannerSlideIntervalSec: normalizeBannerSlideIntervalSec(
          parsed.admin.bannerSlideIntervalSec,
        ),
        siteAppearance: normalizeSiteAppearance(parsed.admin.siteAppearance),
        vapidPublicKey: String(parsed.admin.vapidPublicKey || ""),
        vapidPrivateKey: String(parsed.admin.vapidPrivateKey || ""),
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
    pushSubscriptions: [],
    pendingRegistrations: [],
    pendingSuccessStories: [],
    volunteers: [],
    volunteerActivities: [],
    admin: await defaultAdmin(),
  };
}

function applySchemaMigrations(db: DatabaseShape): boolean {
  let changed = false;
  db.volunteers = (db.volunteers || []).map((v, i) => {
    const normalized = normalizeVolunteer(v);
    if (!normalized) return v;
    const raw = db.volunteers![i];
    if (!raw.linkToken || raw.notificationsEnabled === undefined) {
      changed = true;
      return normalized;
    }
    return v;
  });
  db.donors = db.donors.map((d, i) => {
    const raw = db.donors[i];
    if (
      raw.volunteerSource === undefined ||
      raw.volunteerApproved === undefined
    ) {
      changed = true;
      return normalizeDonor(raw);
    }
    return d;
  });
  return changed;
}

async function hydrateParsed(
  raw: Partial<DatabaseShape>,
): Promise<{ db: DatabaseShape; needsMigrate: boolean }> {
  const { admin, needsMigrate } = await resolveAdmin(raw);
  const db = shapeFromParsed(raw, admin);
  const schemaChanged = applySchemaMigrations(db);
  return { db, needsMigrate: needsMigrate || schemaChanged };
}

async function loadDbFromStores(): Promise<DatabaseShape> {
  if (!loggedStoragePath) {
    loggedStoragePath = true;
    console.info(
      `[bloodlink] Storage backend: ${hasDatabaseUrl() ? "postgres" : "file"} (${hasDatabaseUrl() ? "DATABASE_URL" : dbPath})`,
    );
  }

  if (hasDatabaseUrl()) {
    try {
      const raw = await loadDbFromPostgres();
      const fromFile =
        (await loadDbFromFile(dbPath)) || (await loadDbFromFile(bakPath));

      if (raw) {
        const hydrated = await hydrateParsed(raw);
        // If disk still has a richer donor set (common after a bad empty seed),
        // merge those donors back into Postgres instead of keeping the wipe.
        if (
          fromFile &&
          fromFile.db.donors.length > hydrated.db.donors.length
        ) {
          const byId = new Map(
            hydrated.db.donors.map((d) => [d.id, d] as const),
          );
          for (const donor of fromFile.db.donors) {
            if (!byId.has(donor.id)) byId.set(donor.id, donor);
          }
          hydrated.db.donors = [...byId.values()];
          console.warn(
            `[bloodlink] Restored donors from file into Postgres (${hydrated.db.donors.length} total)`,
          );
          await persist(hydrated.db);
          return hydrated.db;
        }
        if (hydrated.needsMigrate) await persist(hydrated.db);
        return hydrated.db;
      }

      // One-time migrate from local/volume file if Postgres is empty.
      if (fromFile) {
        console.info("[bloodlink] Migrating file database into Postgres");
        await persist(fromFile.db);
        return fromFile.db;
      }

      // Do not auto-seed an empty Postgres row unless both primary + backup
      // files are confirmed missing — avoids wiping on a late volume mount.
      const mainExists = await fileExists(dbPath);
      const bakExists = await fileExists(bakPath);
      if (mainExists || bakExists) {
        throw new Error(
          "[bloodlink] Postgres empty but DB files exist and could not be read — refusing empty seed",
        );
      }

      const empty = await createEmptyDb();
      await persist(empty);
      console.info("[bloodlink] Created new empty Postgres database");
      return empty;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        "[bloodlink] Postgres storage failed — falling back to file storage:",
        err,
      );
      // Never wipe an owner-pasted public URL — only drop private railway.internal.
      if (/ENOTFOUND|ECONNREFUSED|railway\.internal/i.test(message)) {
        clearBrokenPrivateDatabaseUrl();
      }
      // Keep the site online even if a bad/private DATABASE_URL was saved.
    }
  }

  await mkdir(dataDir, { recursive: true });

  const primary = await loadDbFromFile(dbPath);
  if (primary) {
    if (primary.needsMigrate) await persistToFile(primary.db);
    return primary.db;
  }

  const backup = await loadDbFromFile(bakPath);
  if (backup) {
    console.warn("[bloodlink] Primary DB missing/corrupt — restored from backup");
    await persistToFile(backup.db);
    return backup.db;
  }

  const mainExists = await fileExists(dbPath);
  const bakExists = await fileExists(bakPath);
  if (mainExists || bakExists) {
    throw new Error(
      `[bloodlink] Database file exists but could not be read. Refusing to wipe. Path: ${dbPath}`,
    );
  }

  const empty = await createEmptyDb();
  await persistToFile(empty);
  console.info("[bloodlink] Created new empty database");
  return empty;
}

async function ensureDb(): Promise<DatabaseShape> {
  if (memoryDb && Date.now() - memoryDbAt < MEMORY_TTL_MS) {
    return memoryDb;
  }
  if (loadingDb) return loadingDb;
  loadingDb = loadDbFromStores()
    .then((db) => rememberDb(db))
    .finally(() => {
      loadingDb = null;
    });
  return loadingDb;
}

async function pruneRotatingBackups(): Promise<void> {
  try {
    const names = (await readdir(backupsDir))
      .filter((name) => name.startsWith("bloodlink-") && name.endsWith(".json"))
      .sort()
      .reverse();
    for (const name of names.slice(MAX_ROTATING_BACKUPS)) {
      await unlink(path.join(backupsDir, name)).catch(() => undefined);
    }
  } catch {
    /* ignore */
  }
}

async function writeRotatingBackup(db: DatabaseShape): Promise<void> {
  const now = Date.now();
  if (now - lastRotatingBackupAt < ROTATING_BACKUP_INTERVAL_MS) return;
  lastRotatingBackupAt = now;
  try {
    await mkdir(backupsDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(backupsDir, `bloodlink-${stamp}.json`);
    await writeFile(backupPath, JSON.stringify(db, null, 2), "utf8");
    await pruneRotatingBackups();
  } catch (err) {
    console.error("[bloodlink] rotating backup failed:", err);
  }
}

async function persistToFile(db: DatabaseShape): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  if (await fileExists(dbPath)) {
    const existing = await loadDbFromFile(dbPath);
    const existingCount = existing?.db.donors.length ?? 0;
    const nextCount = db.donors.length;
    if (existingCount > 0 && nextCount === 0) {
      throw new Error(
        `[bloodlink] Refusing to overwrite file donors (${existingCount}) with empty data`,
      );
    }
    try {
      await copyFile(dbPath, bakPath);
    } catch (err) {
      console.error("[bloodlink] Backup copy failed:", err);
    }
  }
  await writeFile(tmpPath, JSON.stringify(db, null, 2), "utf8");
  await rename(tmpPath, dbPath);
  await writeRotatingBackup(db);
}

async function persist(db: DatabaseShape): Promise<void> {
  if (hasDatabaseUrl()) {
    try {
      await saveDbToPostgres(db);
      // Mirror to disk when possible so redeploy/fallback keeps data.
      try {
        await persistToFile(db);
      } catch {
        // ignore mirror failures
      }
      rememberDb(db);
      return;
    } catch (err) {
      console.error(
        "[bloodlink] Postgres persist failed — writing file fallback:",
        err,
      );
    }
  }

  await persistToFile(db);
  rememberDb(db);
}

export async function getStorageHealth() {
  let donorCount = 0;
  let readable = false;
  let error: string | null = null;
  const usingPostgres = hasDatabaseUrl();
  let mainExists = false;
  let bakExists = false;
  let pgOk: boolean | null = null;

  await mkdir(dataDir, { recursive: true });
  mainExists = await fileExists(dbPath);
  bakExists = await fileExists(bakPath);

  if (usingPostgres) {
    const health = await postgresHealth();
    pgOk = health.ok;
    if (!health.ok) {
      error = health.error;
    }
  }

  try {
    const db = await ensureDb();
    donorCount = db.donors.length;
    readable = true;
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown storage error";
  }

  const entrypointFlag = runtimeDbFlag();
  const backend =
    usingPostgres && pgOk ? "postgres" : usingPostgres ? "file-fallback" : "file";
  let rotatingBackupCount = 0;
  let latestRotatingBackupAt: string | null = null;
  try {
    const names = (await readdir(backupsDir)).filter(
      (name) => name.startsWith("bloodlink-") && name.endsWith(".json"),
    );
    rotatingBackupCount = names.length;
    if (names.length) {
      const latest = names.sort().at(-1)!;
      latestRotatingBackupAt = (await stat(path.join(backupsDir, latest))).mtime.toISOString();
    }
  } catch {
    /* ignore */
  }
  return {
    ok: readable,
    backend,
    databaseUrlSet: usingPostgres,
    entrypointDbFlag: entrypointFlag,
    dbEnvKeys: listDbEnvKeys(),
    dataDir,
    dbPath,
    mainExists,
    bakExists,
    rotatingBackupCount,
    latestRotatingBackupAt,
    postgresOk: pgOk,
    donorCount,
    persistentHint:
      backend === "postgres"
        ? "Postgres is active — donor data survives website redeploys"
        : backend === "file-fallback"
          ? "Postgres URL failed (often railway.internal). Paste DATABASE_PUBLIC_URL (proxy.rlwy.net) in Owner Settings → Storage."
          : "File storage only — add a Railway Volume at /app/data and/or paste DATABASE_PUBLIC_URL in Owner Settings.",
    error,
  };
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
  return (db.contactRequests || [])
    .map((r) => normalizeContactRequest(r))
    .filter(Boolean)
    .sort(
      (a, b) =>
        new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime(),
    ) as ContactRequest[];
}

export async function findDonorByEmail(email: string): Promise<Donor | null> {
  const db = await ensureDb();
  const donor = db.donors.find(
    (d) => d.email.toLowerCase() === email.toLowerCase(),
  );
  return donor ? normalizeDonor(donor) : null;
}

export async function findDonorByPhone(phone: string): Promise<Donor | null> {
  const db = await ensureDb();
  const normalized = normalizePhone(phone);
  const donor = db.donors.find((d) => normalizePhone(d.phone) === normalized);
  return donor ? normalizeDonor(donor) : null;
}

const PENDING_REG_TTL_MS = 15 * 60 * 1000;

function purgeExpiredPending(db: DatabaseShape, now = Date.now()): number {
  const before = db.pendingRegistrations?.length || 0;
  db.pendingRegistrations = (db.pendingRegistrations || []).filter((p) => {
    const exp = new Date(p.expiresAt).getTime();
    return Number.isFinite(exp) && exp > now;
  });
  return before - db.pendingRegistrations.length;
}

export async function createPendingRegistration(
  input: Omit<
    PendingRegistration,
    "id" | "createdAt" | "expiresAt" | "emailConfirmed" | "phoneConfirmed"
  >,
): Promise<PendingRegistration> {
  return withWrite(async (db) => {
    purgeExpiredPending(db);
    const emailKey = input.email.toLowerCase();
    const phoneKey = normalizePhone(input.phone);
    const now = Date.now();
    const existingIndex = (db.pendingRegistrations || []).findIndex(
      (p) =>
        p.email.toLowerCase() === emailKey ||
        normalizePhone(p.phone) === phoneKey,
    );

    const expiresAt = new Date(now + PENDING_REG_TTL_MS).toISOString();
    let pending: PendingRegistration | null;

    if (existingIndex >= 0) {
      pending = normalizePendingRegistration({
        ...db.pendingRegistrations[existingIndex],
        ...input,
        id: db.pendingRegistrations[existingIndex].id,
        emailConfirmed: false,
        phoneConfirmed: false,
        createdAt: db.pendingRegistrations[existingIndex].createdAt,
        expiresAt,
      });
      if (!pending) throw new Error("Invalid pending registration");
      db.pendingRegistrations[existingIndex] = pending;
    } else {
      pending = normalizePendingRegistration({
        ...input,
        id: randomUUID(),
        emailConfirmed: false,
        phoneConfirmed: false,
        createdAt: new Date(now).toISOString(),
        expiresAt,
      });
      if (!pending) throw new Error("Invalid pending registration");
      db.pendingRegistrations.push(pending);
    }
    await persist(db);
    return pending;
  });
}

export async function findPendingRegistration(
  id: string,
): Promise<PendingRegistration | null> {
  return withWrite(async (db) => {
    const removed = purgeExpiredPending(db);
    const found =
      (db.pendingRegistrations || [])
        .map((p) => normalizePendingRegistration(p))
        .find((p) => p && p.id === id) || null;
    if (removed > 0) await persist(db);
    return found;
  });
}

export async function updatePendingRegistration(
  id: string,
  patch: Partial<
    Pick<
      PendingRegistration,
      | "emailConfirmed"
      | "phoneConfirmed"
      | "emailCodeHash"
      | "phoneCodeHash"
      | "expiresAt"
    >
  >,
): Promise<PendingRegistration | null> {
  return withWrite(async (db) => {
    purgeExpiredPending(db);
    const index = (db.pendingRegistrations || []).findIndex((p) => p.id === id);
    if (index === -1) return null;
    const merged = normalizePendingRegistration({
      ...db.pendingRegistrations[index],
      ...patch,
    });
    if (!merged) return null;
    db.pendingRegistrations[index] = merged;
    await persist(db);
    return merged;
  });
}

export async function deletePendingRegistration(id: string): Promise<void> {
  await withWrite(async (db) => {
    db.pendingRegistrations = (db.pendingRegistrations || []).filter(
      (p) => p.id !== id,
    );
    await persist(db);
  });
}

export async function listPendingSuccessStories(): Promise<PendingSuccessStory[]> {
  const db = await ensureDb();
  return [...(db.pendingSuccessStories || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function createPendingSuccessStory(
  input: Omit<PendingSuccessStory, "id" | "createdAt">,
): Promise<PendingSuccessStory> {
  return withWrite(async (db) => {
    const story = normalizePendingSuccessStory({
      ...input,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    });
    if (!story) throw new Error("Invalid success story");
    db.pendingSuccessStories = db.pendingSuccessStories || [];
    db.pendingSuccessStories.push(story);
    await persist(db);
    return story;
  });
}

export async function approvePendingSuccessStory(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return withWrite(async (db) => {
    const list = db.pendingSuccessStories || [];
    const index = list.findIndex((s) => s.id === id);
    if (index === -1) return { ok: false, error: "Story not found" };
    const pending = list[index];
    const appearance = normalizeSiteAppearance(db.admin.siteAppearance);
    appearance.successStories = [
      {
        id: pending.id,
        name: pending.name,
        handle: pending.handle,
        quoteEn: pending.quoteEn || pending.quoteBn,
        quoteBn: pending.quoteBn || pending.quoteEn,
        enabled: true,
      },
      ...appearance.successStories,
    ];
    db.admin = { ...db.admin, siteAppearance: appearance };
    db.pendingSuccessStories = list.filter((s) => s.id !== id);
    await persist(db);
    return { ok: true };
  });
}

export async function rejectPendingSuccessStory(id: string): Promise<boolean> {
  return withWrite(async (db) => {
    const before = (db.pendingSuccessStories || []).length;
    db.pendingSuccessStories = (db.pendingSuccessStories || []).filter(
      (s) => s.id !== id,
    );
    if ((db.pendingSuccessStories || []).length === before) return false;
    await persist(db);
    return true;
  });
}

export async function deletePublishedSuccessStory(id: string): Promise<boolean> {
  return withWrite(async (db) => {
    const appearance = normalizeSiteAppearance(db.admin.siteAppearance);
    const before = appearance.successStories.length;
    appearance.successStories = appearance.successStories.filter((s) => s.id !== id);
    if (appearance.successStories.length === before) return false;
    db.admin = { ...db.admin, siteAppearance: appearance };
    await persist(db);
    return true;
  });
}

export async function getSiteImpactStats() {
  const db = await ensureDb();
  const posts = await listPosts();
  const donors = db.donors.map((d) => normalizeDonor(d));
  const districts = new Set(donors.map((d) => d.district).filter(Boolean));
  const verifiedDonors = donors.filter(
    (d) => d.emailVerified || d.phoneVerified,
  ).length;
  // Admin-approved (enabled) success stories = people who received help.
  const helpedFromStories = normalizeSiteAppearance(
    db.admin.siteAppearance,
  ).successStories.filter((s) => s.enabled).length;
  return {
    livesHelped: helpedFromStories,
    registeredUsers: donors.length,
    activeRequests: posts.length,
    citiesCovered: districts.size,
    verifiedDonors,
    availableDonors: donors.filter((d) =>
      isDonorAvailable(d.gender, d.lastDonationDate),
    ).length,
  };
}

export async function findDonorById(id: string): Promise<Donor | null> {
  const db = await ensureDb();
  const donor = db.donors.find((d) => d.id === id);
  return donor ? normalizeDonor(donor) : null;
}

export async function createDonor(
  input: Omit<
    Donor,
    | "id"
    | "createdAt"
    | "updatedAt"
    | "available"
    | "createdByVolunteerId"
    | "pendingEmailCodeHash"
    | "pendingPhoneCodeHash"
    | "pendingResetCodeHash"
    | "pendingResetChannel"
    | "pendingResetExpiresAt"
    | "volunteerSource"
    | "volunteerApproved"
    | "lastLoginAt"
  > &
    Partial<
      Pick<
        Donor,
        | "emailVerified"
        | "phoneVerified"
        | "pendingEmailCodeHash"
        | "pendingPhoneCodeHash"
        | "pendingResetCodeHash"
        | "pendingResetChannel"
        | "pendingResetExpiresAt"
        | "donationCount"
        | "createdByVolunteerId"
        | "volunteerSource"
        | "volunteerApproved"
      >
    >,
): Promise<Donor> {
  return withWrite(async (db) => {
    const now = new Date().toISOString();
    const lastDonationDate = input.lastDonationDate ?? null;
    const donationCount =
      input.donationCount != null
        ? Math.max(0, Math.floor(Number(input.donationCount) || 0))
        : lastDonationDate
          ? 1
          : 0;
    const donor = normalizeDonor({
      ...input,
      donationCount,
      emailVerified: input.emailVerified ?? false,
      phoneVerified: input.phoneVerified ?? false,
      pendingEmailCodeHash: input.pendingEmailCodeHash ?? null,
      pendingPhoneCodeHash: input.pendingPhoneCodeHash ?? null,
      pendingResetCodeHash: input.pendingResetCodeHash ?? null,
      pendingResetChannel: input.pendingResetChannel ?? null,
      pendingResetExpiresAt: input.pendingResetExpiresAt ?? null,
      createdByVolunteerId: input.createdByVolunteerId ?? null,
      volunteerSource: input.volunteerSource ?? null,
      volunteerApproved:
        input.volunteerApproved ??
        (input.volunteerSource === "link" ? true : input.createdByVolunteerId ? false : true),
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
    db.donors.push(donor);
    await persist(db);
    void notifyAdminNewDonorRegistration(donor).catch((err) => {
      console.error("[bloodlink] admin new-donor notify failed:", err);
    });
    return donor;
  });
}

export async function notifyAdminNewDonorRegistration(donor: Donor): Promise<void> {
  const texts = withBilingual(newDonorAdminTexts(donor));
  await withWrite(async (db) => {
    db.notifications.push({
      id: randomUUID(),
      userId: ADMIN_NOTIFY_USER_ID,
      ...texts,
      type: "new_donor",
      href: "/bloodlinkbd.admin.rony4505",
      read: false,
      createdAt: new Date().toISOString(),
    });
    await persist(db);
  });

  void import("./web-push-send")
    .then((m) =>
      m.sendWebPushToUsers([ADMIN_NOTIFY_USER_ID], {
        title: texts.titleBn || texts.title,
        body: texts.bodyBn || texts.body,
        url: "/bloodlinkbd.admin.rony4505",
        tag: `new-donor-${donor.id}`,
      }),
    )
    .catch(() => undefined);
}

export async function listAdminNotifications() {
  const db = await ensureDb();
  return db.notifications
    .filter((n) => n.userId === ADMIN_NOTIFY_USER_ID)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function markAdminNotificationRead(id: string): Promise<boolean> {
  return withWrite(async (db) => {
    const item = db.notifications.find(
      (n) => n.id === id && n.userId === ADMIN_NOTIFY_USER_ID,
    );
    if (!item) return false;
    item.read = true;
    await persist(db);
    return true;
  });
}

export async function markAllAdminNotificationsRead(): Promise<void> {
  return withWrite(async (db) => {
    for (const n of db.notifications) {
      if (n.userId === ADMIN_NOTIFY_USER_ID) n.read = true;
    }
    await persist(db);
  });
}

export async function upsertAdminPushSubscription(input: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<void> {
  await upsertPushSubscription({
    userId: ADMIN_NOTIFY_USER_ID,
    endpoint: input.endpoint,
    p256dh: input.p256dh,
    auth: input.auth,
  });
}

export async function adminHasDeliverablePush(): Promise<boolean> {
  return donorHasDeliverablePushSubscription(ADMIN_NOTIFY_USER_ID);
}

export async function listDonorsByVolunteer(
  volunteerId: string,
): Promise<Donor[]> {
  const db = await ensureDb();
  return db.donors
    .map((d) => normalizeDonor(d))
    .filter((d) => d.createdByVolunteerId === volunteerId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
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
      | "donationCount"
      | "bloodIssue"
      | "passwordHash"
      | "emailVerified"
      | "phoneVerified"
      | "pendingEmailCodeHash"
      | "pendingPhoneCodeHash"
      | "pendingResetCodeHash"
      | "pendingResetChannel"
      | "pendingResetExpiresAt"
      | "createdByVolunteerId"
      | "volunteerSource"
      | "volunteerApproved"
      | "lastLoginAt"
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

/**
 * Link an already-registered donor to a volunteer's manual work (pending admin approval).
 * Only allowed when the donor is not already attributed to another volunteer.
 */
export async function claimExistingDonorForVolunteer(
  volunteerId: string,
  phone: string,
): Promise<
  | { status: "claimed"; donor: Donor }
  | { status: "already_yours"; donor: Donor }
  | { status: "claimed_by_other" }
  | { status: "not_found" }
> {
  const existing = await findDonorByPhone(phone);
  if (!existing) return { status: "not_found" };

  if (existing.createdByVolunteerId === volunteerId) {
    return { status: "already_yours", donor: existing };
  }
  if (existing.createdByVolunteerId) {
    return { status: "claimed_by_other" };
  }

  const donor = await updateDonor(existing.id, {
    createdByVolunteerId: volunteerId,
    volunteerSource: "manual",
    volunteerApproved: false,
  });
  if (!donor) return { status: "not_found" };

  void notifyAdminNewDonorRegistration(donor).catch((err) => {
    console.error("[bloodlink] admin claim-donor notify failed:", err);
  });

  return { status: "claimed", donor };
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
    await persist(db);
    return true;
  });
}

export async function createContactRequest(
  input: Omit<ContactRequest, "id" | "createdAt">,
): Promise<ContactRequest> {
  return withWrite(async (db) => {
    const request = normalizeContactRequest({
      ...input,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    });
    if (!request) throw new Error("INVALID_CONTACT_REQUEST");
    db.contactRequests.push(request);
    await persist(db);
    return request;
  });
}

/** Avoid duplicate post-phone reveal logs for the same viewer+post within a day. */
export async function hasRecentPostContactLog(
  postId: string,
  seekerUserId: string,
  withinMs = 24 * 60 * 60 * 1000,
): Promise<boolean> {
  const db = await ensureDb();
  const cutoff = Date.now() - withinMs;
  return (db.contactRequests || []).some(
    (r) =>
      r.kind === "post_phone" &&
      r.postId === postId &&
      r.seekerUserId === seekerUserId &&
      new Date(r.createdAt).getTime() >= cutoff,
  );
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

/** Blood-need posts auto-expire this long after creation. */
const POST_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function normalizePost(raw: Partial<BloodPost> & { id: string }): BloodPost {
  const neededBy = raw.neededBy || raw.createdAt?.slice(0, 10) || "";
  const selected =
    POST_URGENCIES.includes(raw.urgency as PostUrgency)
      ? (raw.urgency as PostUrgency)
      : "urgent";
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
    neededBy,
    message: raw.message ?? "",
    urgency: resolvePostUrgency(selected, neededBy),
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
}

function isPostExpired(post: BloodPost, now = Date.now()): boolean {
  const created = new Date(post.createdAt).getTime();
  if (!Number.isFinite(created)) return true;
  return now - created >= POST_MAX_AGE_MS;
}

/** Remove posts older than 7 days (and related notifications). Returns how many were removed. */
function purgeExpiredPostsInDb(db: DatabaseShape, now = Date.now()): number {
  const expiredIds = new Set(
    db.posts
      .filter((p) => isPostExpired(normalizePost(p), now))
      .map((p) => p.id),
  );
  if (expiredIds.size === 0) return 0;
  db.posts = db.posts.filter((p) => !expiredIds.has(p.id));
  db.notifications = db.notifications.filter(
    (n) => !(n.postId && expiredIds.has(n.postId)),
  );
  return expiredIds.size;
}

async function purgeExpiredPosts(): Promise<void> {
  await withWrite(async (db) => {
    const removed = purgeExpiredPostsInDb(db);
    if (removed > 0) await persist(db);
  });
}

export async function listPosts(): Promise<BloodPost[]> {
  await purgeExpiredPosts();
  const db = await ensureDb();
  return db.posts
    .map((p) => normalizePost(p))
    .filter((p) => !isPostExpired(p))
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function findPostById(id: string): Promise<BloodPost | null> {
  await purgeExpiredPosts();
  const db = await ensureDb();
  const post = db.posts.find((p) => p.id === id);
  if (!post) return null;
  const normalized = normalizePost(post);
  if (isPostExpired(normalized)) return null;
  return normalized;
}

export async function createPost(
  input: Omit<BloodPost, "id" | "createdAt">,
): Promise<BloodPost> {
  const { post, notifyUserIds, pushTitle, pushBody } = await withWrite(async (db) => {
    purgeExpiredPostsInDb(db);
    const next = normalizePost({
      ...input,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    });
    db.posts.push(next);

    const texts = withBilingual(bloodRequestTexts(next));
    const notifySettings = normalizeNotificationSettings(
      db.admin.notificationSettings,
    );
    const notifyUserIds: string[] = [];
    if (notifySettings.bloodRequestBroadcast.enabled) {
      const createdAt = new Date().toISOString();
      for (const donor of db.donors) {
        db.notifications.push({
          id: randomUUID(),
          userId: donor.id,
          ...texts,
          type: "blood_request",
          href: `/requests/${next.id}`,
          postId: next.id,
          read: false,
          createdAt,
        });
        notifyUserIds.push(donor.id);
      }
      // Owner admin also gets the blood-need push (same device can keep admin + donor rows).
      db.notifications.push({
        id: randomUUID(),
        userId: ADMIN_NOTIFY_USER_ID,
        ...texts,
        type: "blood_request",
        href: `/requests/${next.id}`,
        postId: next.id,
        read: false,
        createdAt,
      });
      notifyUserIds.push(ADMIN_NOTIFY_USER_ID);
    }

    await persist(db);
    return {
      post: next,
      notifyUserIds,
      pushTitle: texts.titleBn || texts.title,
      pushBody: texts.bodyBn || texts.body,
    };
  });

  if (notifyUserIds.length) {
    void import("./web-push-send")
      .then((m) =>
        m.sendWebPushToUsers(notifyUserIds, {
          title: pushTitle,
          body: pushBody,
          url: `/requests/${post.id}`,
          tag: `blood-${post.id}`,
        }),
      )
      .catch(() => undefined);
  }

  return post;
}

export async function listNotifications(
  userId: string,
): Promise<AppNotification[]> {
  const db = await ensureDb();
  return db.notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => {
      // Blood-need posts first so the newest emergency is always at the top.
      const aBlood = a.type === "blood_request" ? 0 : 1;
      const bBlood = b.type === "blood_request" ? 0 : 1;
      if (aBlood !== bBlood) return aBlood - bBlood;
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
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

export async function createVolunteerNotification(input: {
  volunteerId: string;
  title: string;
  body: string;
  href?: string;
}): Promise<AppNotification> {
  return withWrite(async (db) => {
    const { volunteerPushUserId } = await import("./volunteer-urls");
    const notification: AppNotification = {
      id: randomUUID(),
      userId: volunteerPushUserId(input.volunteerId),
      title: input.title,
      body: input.body,
      type: "system",
      href: input.href || "/",
      read: false,
      createdAt: new Date().toISOString(),
    };
    db.notifications.push(notification);
    await persist(db);
    return notification;
  });
}

export async function markVolunteerNotificationRead(
  volunteerId: string,
  notificationId: string,
): Promise<boolean> {
  const { volunteerPushUserId } = await import("./volunteer-urls");
  return markNotificationRead(volunteerPushUserId(volunteerId), notificationId);
}

export async function markAllVolunteerNotificationsRead(
  volunteerId: string,
): Promise<void> {
  const { volunteerPushUserId } = await import("./volunteer-urls");
  return markAllNotificationsRead(volunteerPushUserId(volunteerId));
}

export async function listVolunteerNotifications(
  volunteerId: string,
): Promise<AppNotification[]> {
  const { volunteerPushUserId } = await import("./volunteer-urls");
  return listNotifications(volunteerPushUserId(volunteerId));
}

export async function createDailyRemindersIfNeeded(
  todayKey = bangladeshDateKey(),
): Promise<number> {
  const { created, userIds, texts } = await withWrite(async (db) => {
    const settings = normalizeNotificationSettings(db.admin.notificationSettings)
      .dailyDonationReminder;
    if (!settings.enabled) return { created: 0, userIds: [] as string[], texts: null };
    if (bangladeshHour() < settings.hourBd) {
      return { created: 0, userIds: [] as string[], texts: null };
    }

    const intervalDays = Math.max(1, settings.intervalDays);
    let created = 0;
    const userIds: string[] = [];
    const texts = withBilingual(dailyReminderTexts());
    const createdAt = new Date().toISOString();

    for (const donor of db.donors) {
      const previous = db.notifications
        .filter((n) => n.userId === donor.id && n.type === "daily_update")
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0];

      if (previous) {
        const previousKey = bangladeshDateKey(new Date(previous.createdAt));
        if (previousKey === todayKey) continue;
        if (daysBetweenDateKeys(previousKey, todayKey) < intervalDays) continue;
      }

      db.notifications.push({
        id: randomUUID(),
        userId: donor.id,
        ...texts,
        type: "daily_update",
        href: "/dashboard",
        read: false,
        createdAt,
      });
      userIds.push(donor.id);
      created += 1;
    }
    if (created) await persist(db);
    return { created, userIds, texts };
  });

  if (created && texts) {
    void import("./web-push-send")
      .then((m) =>
        m.sendWebPushToUsers(userIds, {
          title: texts.titleBn || texts.title,
          body: texts.bodyBn || texts.body,
          url: "/dashboard",
          tag: `daily-${todayKey}`,
        }),
      )
      .catch(() => undefined);
  }

  return created;
}

/** Once per BD calendar month: bless the top Gold/Platinum donor. */
export async function createMonthlyGoldBlessingIfNeeded(
  monthKey = bangladeshDateKey().slice(0, 7),
): Promise<{ created: boolean; donorId: string | null }> {
  const result = await withWrite(async (db) => {
    const settings = normalizeNotificationSettings(db.admin.notificationSettings)
      .monthlyGoldBlessing;
    if (!settings.enabled) return { created: false, donorId: null as string | null, texts: null };
    if (bangladeshHour() < settings.hourBd) {
      return { created: false, donorId: null as string | null, texts: null };
    }

    const already = db.notifications.some(
      (n) =>
        n.type === "gold_blessing" &&
        bangladeshDateKey(new Date(n.createdAt)).startsWith(monthKey),
    );
    if (already) return { created: false, donorId: null as string | null, texts: null };

    const ranked = [...db.donors]
      .map((d) => normalizeDonor(d))
      .filter((d) => (d.donationCount || 0) >= 10)
      .sort((a, b) => {
        const diff = (b.donationCount || 0) - (a.donationCount || 0);
        if (diff !== 0) return diff;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

    const top = ranked[0];
    if (!top) return { created: false, donorId: null as string | null, texts: null };

    const texts = withBilingual(
      goldBlessingTexts(top.name, top.donationCount || 0),
    );
    db.notifications.push({
      id: randomUUID(),
      userId: top.id,
      ...texts,
      type: "gold_blessing",
      href: "/dashboard",
      read: false,
      createdAt: new Date().toISOString(),
    });
    await persist(db);
    return { created: true, donorId: top.id, texts };
  });

  if (result.created && result.donorId && result.texts) {
    void import("./web-push-send")
      .then((m) =>
        m.sendWebPushToUsers([result.donorId!], {
          title: result.texts!.titleBn || result.texts!.title,
          body: result.texts!.bodyBn || result.texts!.body,
          url: "/notifications",
          tag: `gold-${monthKey}`,
        }),
      )
      .catch(() => undefined);
  }

  return { created: result.created, donorId: result.donorId };
}

export async function ensureVapidKeys(): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  const admin = await getAdminSettings();
  if (admin.vapidPublicKey && admin.vapidPrivateKey) {
    return { publicKey: admin.vapidPublicKey, privateKey: admin.vapidPrivateKey };
  }
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    const publicKey = process.env.VAPID_PUBLIC_KEY.trim();
    const privateKey = process.env.VAPID_PRIVATE_KEY.trim();
    await updateAdminSettings({ vapidPublicKey: publicKey, vapidPrivateKey: privateKey });
    return { publicKey, privateKey };
  }

  const webpush = await import("web-push");
  const generated = webpush.generateVAPIDKeys();
  await updateAdminSettings({
    vapidPublicKey: generated.publicKey,
    vapidPrivateKey: generated.privateKey,
  });
  return generated;
}

export async function listPushSubscriptions(
  userIds?: string[],
): Promise<PushSubscriptionRecord[]> {
  const db = await ensureDb();
  const list = db.pushSubscriptions || [];
  if (!userIds?.length) return [...list];
  const set = new Set(userIds);
  return list.filter((s) => set.has(s.userId));
}

/** Unique donors with a real deliverable Web Push subscription. */
export async function countPushAllowStats(): Promise<{
  donorCount: number;
  allowedUsers: number;
  permissionOnlyUsers: number;
  subscriptions: number;
  deliverableSubscriptions: number;
  donors: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    bloodGroup: string;
    pushStatus: "deliverable" | "permission_only" | "none";
    subscriptionCount: number;
    deliverableCount: number;
    allowedAt: string | null;
    lastLoginAt: string | null;
  }>;
}> {
  const db = await ensureDb();
  const list = db.pushSubscriptions || [];
  const countByUser = new Map<string, number>();
  const deliverableByUser = new Map<string, number>();
  const latestSubByUser = new Map<string, string>();
  for (const s of list) {
    if (!s.userId) continue;
    countByUser.set(s.userId, (countByUser.get(s.userId) || 0) + 1);
    if (isDeliverablePushSubscription(s)) {
      deliverableByUser.set(s.userId, (deliverableByUser.get(s.userId) || 0) + 1);
    }
    const prev = latestSubByUser.get(s.userId);
    if (!prev || String(s.createdAt) > prev) {
      latestSubByUser.set(s.userId, String(s.createdAt || ""));
    }
  }
  const donors = [...db.donors]
    .map((d) => {
      const subscriptionCount = countByUser.get(d.id) || 0;
      const deliverableCount = deliverableByUser.get(d.id) || 0;
      const pushStatus = donorPushStatusFromSubscriptions(list, d.id);
      return {
        id: d.id,
        name: d.name,
        email: d.email,
        phone: d.phone,
        bloodGroup: d.bloodGroup,
        pushStatus,
        subscriptionCount,
        deliverableCount,
        allowedAt:
          pushStatus === "none" ? null : latestSubByUser.get(d.id) || null,
        lastLoginAt: d.lastLoginAt || null,
      };
    })
    .sort((a, b) => {
      const rank = (s: typeof a.pushStatus) =>
        s === "deliverable" ? 0 : s === "permission_only" ? 1 : 2;
      const diff = rank(a.pushStatus) - rank(b.pushStatus);
      if (diff !== 0) return diff;
      const aLogin = a.lastLoginAt || "";
      const bLogin = b.lastLoginAt || "";
      if (aLogin !== bLogin) return bLogin.localeCompare(aLogin);
      return a.name.localeCompare(b.name);
    });
  return {
    donorCount: db.donors.length,
    allowedUsers: donors.filter((d) => d.pushStatus === "deliverable").length,
    permissionOnlyUsers: donors.filter((d) => d.pushStatus === "permission_only").length,
    subscriptions: list.length,
    deliverableSubscriptions: list.filter(isDeliverablePushSubscription).length,
    donors,
  };
}

export async function donorHasDeliverablePushSubscription(userId: string): Promise<boolean> {
  const db = await ensureDb();
  return (db.pushSubscriptions || []).some(
    (s) => s.userId === userId && isDeliverablePushSubscription(s),
  );
}

export async function donorHasPermissionOnlyPush(userId: string): Promise<boolean> {
  const db = await ensureDb();
  return (db.pushSubscriptions || []).some(
    (s) => s.userId === userId && isPermissionOnlyPushSubscription(s),
  );
}

/** @deprecated use donorHasDeliverablePushSubscription or donorHasPermissionOnlyPush */
export async function donorHasPushSubscription(userId: string): Promise<boolean> {
  const db = await ensureDb();
  return (db.pushSubscriptions || []).some((s) => s.userId === userId);
}

export async function upsertPushSubscription(input: {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<PushSubscriptionRecord> {
  return withWrite(async (db) => {
    if (!db.pushSubscriptions) db.pushSubscriptions = [];
    // Key by (userId, endpoint) so admin + donor on the same phone keep separate rows.
    // Never steal another role's subscription when they share one browser PushManager endpoint.
    const existing = db.pushSubscriptions.findIndex(
      (s) => s.endpoint === input.endpoint && s.userId === input.userId,
    );
    const record: PushSubscriptionRecord = {
      id: existing >= 0 ? db.pushSubscriptions[existing].id : randomUUID(),
      userId: input.userId,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
      createdAt:
        existing >= 0
          ? db.pushSubscriptions[existing].createdAt
          : new Date().toISOString(),
    };
    if (existing >= 0) db.pushSubscriptions[existing] = record;
    else db.pushSubscriptions.push(record);
    await persist(db);
    return record;
  });
}

export async function removePushSubscriptionByEndpoint(
  endpoint: string,
): Promise<void> {
  return withWrite(async (db) => {
    db.pushSubscriptions = (db.pushSubscriptions || []).filter(
      (s) => s.endpoint !== endpoint,
    );
    await persist(db);
  });
}

export async function removePushSubscriptionForUser(
  userId: string,
  endpoint?: string,
): Promise<void> {
  return withWrite(async (db) => {
    db.pushSubscriptions = (db.pushSubscriptions || []).filter((s) => {
      if (s.userId !== userId) return true;
      if (endpoint) return s.endpoint !== endpoint;
      return false;
    });
    await persist(db);
  });
}

export async function broadcastSystemAnnouncement(input: {
  titleEn: string;
  titleBn: string;
  bodyEn: string;
  bodyBn: string;
  href?: string;
}): Promise<number> {
  const { created, userIds, texts, href } = await withWrite(async (db) => {
    const settings = normalizeNotificationSettings(db.admin.notificationSettings);
    if (!settings.systemAnnouncements.enabled) {
      return { created: 0, userIds: [] as string[], texts: null, href: "/notifications" };
    }

    const texts = withBilingual({
      titleEn: input.titleEn,
      titleBn: input.titleBn,
      bodyEn: input.bodyEn,
      bodyBn: input.bodyBn,
    });
    const href = input.href?.trim() || "/notifications";
    const createdAt = new Date().toISOString();
    const userIds: string[] = [];
    let created = 0;
    for (const donor of db.donors) {
      db.notifications.push({
        id: randomUUID(),
        userId: donor.id,
        ...texts,
        type: "system",
        href,
        read: false,
        createdAt,
      });
      userIds.push(donor.id);
      created += 1;
    }
    if (created) await persist(db);
    return { created, userIds, texts, href };
  });

  if (created && texts) {
    void import("./web-push-send")
      .then((m) =>
        m.sendWebPushToUsers(userIds, {
          title: texts.titleBn || texts.title,
          body: texts.bodyBn || texts.body,
          url: href,
          tag: `sys-${Date.now()}`,
        }),
      )
      .catch(() => undefined);
  }

  return created;
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
    const notifySettings = normalizeNotificationSettings(
      db.admin.notificationSettings,
    );
    if (notifySettings.contactChangeAlerts.enabled) {
      db.notifications.push({
        id: randomUUID(),
        userId: request.donorId,
        ...texts,
        type: "contact_change",
        href: "/dashboard",
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

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
    const next = { ...db.admin, ...patch };
    if (patch.notificationSettings) {
      next.notificationSettings = normalizeNotificationSettings(
        patch.notificationSettings,
      );
    }
    if (patch.platformOptions) {
      next.platformOptions = normalizePlatformOptions(patch.platformOptions);
    }
    db.admin = next;
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

/** Rewrite old random tokens to name-based slugs (e.g. /work/karim-ahmed). */
export async function ensureVolunteerNameLinkTokens(): Promise<number> {
  const db = await ensureDb();
  const volunteers = db.volunteers || [];
  if (!volunteers.some((v) => looksLikeRandomPortalToken(String(v.linkToken || "")))) {
    return 0;
  }
  return withWrite(async (writeDb) => {
    writeDb.volunteers = writeDb.volunteers || [];
    let changed = 0;
    const taken = new Set(
      writeDb.volunteers
        .map((v) => String(v.linkToken || "").trim().toLowerCase())
        .filter(Boolean),
    );
    const now = new Date().toISOString();
    for (let i = 0; i < writeDb.volunteers.length; i++) {
      const v = normalizeVolunteer(writeDb.volunteers[i]);
      if (!v) continue;
      if (!looksLikeRandomPortalToken(v.linkToken)) continue;
      taken.delete(v.linkToken.toLowerCase());
      const next = newVolunteerLinkToken(v.name, taken);
      taken.add(next.toLowerCase());
      writeDb.volunteers[i] = { ...v, linkToken: next, updatedAt: now };
      changed += 1;
    }
    if (changed) await persist(writeDb);
    return changed;
  });
}

export async function listVolunteers(): Promise<Volunteer[]> {
  await ensureVolunteerNameLinkTokens();
  const db = await ensureDb();
  return (db.volunteers || [])
    .map((v) => normalizeVolunteer(v))
    .filter(Boolean)
    .sort((a, b) => a!.name.localeCompare(b!.name)) as Volunteer[];
}

export async function findVolunteerById(id: string): Promise<Volunteer | null> {
  const db = await ensureDb();
  const found = (db.volunteers || []).find((v) => v.id === id);
  return found ? normalizeVolunteer(found) : null;
}

export async function findVolunteerByLinkToken(
  token: string,
): Promise<Volunteer | null> {
  const db = await ensureDb();
  const key = decodeURIComponent(token.trim());
  if (!key) return null;
  const found = (db.volunteers || []).find((v) => {
    const t = String(v.linkToken || "");
    return t === key || t.toLowerCase() === key.toLowerCase();
  });
  return found ? normalizeVolunteer(found) : null;
}

export type VolunteerDonorSummary = {
  id: string;
  name: string;
  bloodGroup: string;
  district: string;
  area: string;
  phone?: string;
  createdAt: string;
  volunteerSource: "link" | "manual" | null;
  volunteerApproved: boolean;
};

export async function listVolunteerDonorSummaries(
  volunteerId: string,
  opts?: { date?: string; approvedOnly?: boolean },
): Promise<VolunteerDonorSummary[]> {
  const db = await ensureDb();
  const date = opts?.date?.slice(0, 10);
  return db.donors
    .map((d) => normalizeDonor(d))
    .filter((d) => d.createdByVolunteerId === volunteerId)
    .filter((d) => (opts?.approvedOnly ? d.volunteerApproved : true))
    .filter((d) => {
      if (!date) return true;
      return d.createdAt.slice(0, 10) === date;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .map((d) => ({
      id: d.id,
      name: d.name,
      bloodGroup: d.bloodGroup,
      district: d.district,
      area: d.area,
      createdAt: d.createdAt,
      volunteerSource: d.volunteerSource,
      volunteerApproved: d.volunteerApproved,
    }));
}

export async function listPendingVolunteerDonors(): Promise<
  (VolunteerDonorSummary & { volunteerId: string; volunteerName: string })[]
> {
  const db = await ensureDb();
  const volunteerMap = new Map(
    (db.volunteers || []).map((v) => {
      const n = normalizeVolunteer(v);
      return n ? [n.id, n.name] as const : null;
    }).filter(Boolean) as [string, string][],
  );
  return db.donors
    .map((d) => normalizeDonor(d))
    .filter((d) => {
      if (!d.createdByVolunteerId || d.volunteerApproved) return false;
      // Manual adds (and older rows missing volunteerSource) need admin approval.
      return d.volunteerSource === "manual" || d.volunteerSource == null;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .map((d) => ({
      id: d.id,
      name: d.name,
      bloodGroup: d.bloodGroup,
      district: d.district,
      area: d.area,
      phone: d.phone,
      createdAt: d.createdAt,
      volunteerSource: d.volunteerSource,
      volunteerApproved: d.volunteerApproved,
      volunteerId: d.createdByVolunteerId!,
      volunteerName: volunteerMap.get(d.createdByVolunteerId!) || "— (volunteer removed)",
    }));
}

export async function setVolunteerDonorApproval(
  donorId: string,
  approved: boolean,
): Promise<Donor | null> {
  return updateDonor(donorId, { volunteerApproved: approved });
}

export async function findVolunteerByUsername(
  username: string,
): Promise<Volunteer | null> {
  const db = await ensureDb();
  const key = username.trim().toLowerCase();
  if (!key) return null;
  const found = (db.volunteers || []).find(
    (v) => String(v.username || "").toLowerCase() === key,
  );
  return found ? normalizeVolunteer(found) : null;
}

export async function listVolunteerActivities(
  volunteerId?: string,
): Promise<VolunteerActivity[]> {
  const db = await ensureDb();
  return (db.volunteerActivities || [])
    .map((a) => normalizeVolunteerActivity(a))
    .filter((a): a is VolunteerActivity => Boolean(a))
    .filter((a) => (volunteerId ? a.volunteerId === volunteerId : true))
    .sort((a, b) => {
      const byDate = (b.activityDate || "").localeCompare(a.activityDate || "");
      if (byDate) return byDate;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

export async function createVolunteer(
  input: Omit<Volunteer, "id" | "createdAt" | "updatedAt">,
): Promise<Volunteer> {
  return withWrite(async (db) => {
    const username = String(input.username || "").trim().toLowerCase();
    if (!username) throw new Error("Username required");
    db.volunteers = db.volunteers || [];
    if (
      db.volunteers.some(
        (v) => String(v.username || "").toLowerCase() === username,
      )
    ) {
      throw new Error("Username already taken");
    }
    const now = new Date().toISOString();
    const taken = db.volunteers.map((v) => String(v.linkToken || ""));
    const linkToken =
      String(input.linkToken || "").trim() ||
      newVolunteerLinkToken(input.name, taken);
    const volunteer = normalizeVolunteer({
      ...input,
      username,
      linkToken,
      notificationsEnabled: input.notificationsEnabled !== false,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
    if (!volunteer) throw new Error("Invalid volunteer");
    db.volunteers.push(volunteer);
    await persist(db);
    return volunteer;
  });
}

export async function regenerateVolunteerLinkToken(
  id: string,
): Promise<Volunteer | null> {
  return withWrite(async (db) => {
    db.volunteers = db.volunteers || [];
    const index = db.volunteers.findIndex((v) => v.id === id);
    if (index === -1) return null;
    const current = normalizeVolunteer(db.volunteers[index]);
    if (!current) return null;
    const taken = db.volunteers
      .filter((_, i) => i !== index)
      .map((v) => String(v.linkToken || ""));
    const merged = normalizeVolunteer({
      ...current,
      linkToken: newVolunteerLinkToken(current.name, taken),
      updatedAt: new Date().toISOString(),
    });
    if (!merged) return null;
    db.volunteers[index] = merged;
    await persist(db);
    return merged;
  });
}

export async function updateVolunteer(
  id: string,
  patch: Partial<
    Pick<
      Volunteer,
      | "name"
      | "phone"
      | "email"
      | "district"
      | "role"
      | "notes"
      | "enabled"
      | "username"
      | "passwordHash"
      | "notificationsEnabled"
      | "linkToken"
    >
  > & { regenerateToken?: boolean },
): Promise<Volunteer | null> {
  return withWrite(async (db) => {
    db.volunteers = db.volunteers || [];
    const index = db.volunteers.findIndex((v) => v.id === id);
    if (index === -1) return null;
    if (patch.username) {
      const key = patch.username.trim().toLowerCase();
      const clash = db.volunteers.some(
        (v, i) =>
          i !== index && String(v.username || "").toLowerCase() === key,
      );
      if (clash) throw new Error("Username already taken");
    }
    const current = db.volunteers[index]!;
    const nextName =
      patch.name !== undefined ? String(patch.name).trim() : current.name;
    let linkToken = current.linkToken;
    if (patch.regenerateToken || patch.linkToken !== undefined) {
      const taken = db.volunteers
        .filter((_, i) => i !== index)
        .map((v) => String(v.linkToken || ""));
      linkToken =
        patch.linkToken !== undefined && String(patch.linkToken).trim()
          ? String(patch.linkToken).trim()
          : newVolunteerLinkToken(nextName, taken);
    } else if (
      patch.name !== undefined &&
      looksLikeRandomPortalToken(String(current.linkToken || ""))
    ) {
      const taken = db.volunteers
        .filter((_, i) => i !== index)
        .map((v) => String(v.linkToken || ""));
      linkToken = newVolunteerLinkToken(nextName, taken);
    } else if (patch.name !== undefined) {
      // Keep URL readable: refresh slug from the new name when possible.
      const taken = db.volunteers
        .filter((_, i) => i !== index)
        .map((v) => String(v.linkToken || ""));
      linkToken = newVolunteerLinkToken(nextName, taken);
    }
    const merged = normalizeVolunteer({
      ...current,
      ...patch,
      name: nextName,
      linkToken,
      username:
        patch.username !== undefined
          ? patch.username.trim().toLowerCase()
          : current.username,
      updatedAt: new Date().toISOString(),
    });
    if (!merged) return null;
    db.volunteers[index] = merged;
    await persist(db);
    return merged;
  });
}

export async function deleteVolunteer(id: string): Promise<boolean> {
  return withWrite(async (db) => {
    const before = (db.volunteers || []).length;
    db.volunteers = (db.volunteers || []).filter((v) => v.id !== id);
    // Keep volunteerActivities and donor records (createdByVolunteerId) — only remove the volunteer profile and URLs.
    if ((db.volunteers || []).length === before) return false;
    await persist(db);
    return true;
  });
}

export async function createVolunteerActivity(
  input: Omit<VolunteerActivity, "id" | "createdAt" | "updatedAt">,
): Promise<VolunteerActivity> {
  return withWrite(async (db) => {
    const exists = (db.volunteers || []).some((v) => v.id === input.volunteerId);
    if (!exists) throw new Error("Volunteer not found");
    const now = new Date().toISOString();
    const activity = normalizeVolunteerActivity({
      ...input,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
    if (!activity) throw new Error("Invalid activity");
    db.volunteerActivities = db.volunteerActivities || [];
    db.volunteerActivities.push(activity);
    await persist(db);
    return activity;
  });
}

export async function updateVolunteerActivity(
  id: string,
  patch: Partial<
    Pick<
      VolunteerActivity,
      | "title"
      | "description"
      | "activityType"
      | "status"
      | "activityDate"
      | "volunteerNote"
    >
  >,
): Promise<VolunteerActivity | null> {
  return withWrite(async (db) => {
    db.volunteerActivities = db.volunteerActivities || [];
    const index = db.volunteerActivities.findIndex((a) => a.id === id);
    if (index === -1) return null;
    const merged = normalizeVolunteerActivity({
      ...db.volunteerActivities[index],
      ...patch,
      updatedAt: new Date().toISOString(),
    });
    if (!merged) return null;
    db.volunteerActivities[index] = merged;
    await persist(db);
    return merged;
  });
}

export async function deleteVolunteerActivity(id: string): Promise<boolean> {
  return withWrite(async (db) => {
    const before = (db.volunteerActivities || []).length;
    db.volunteerActivities = (db.volunteerActivities || []).filter(
      (a) => a.id !== id,
    );
    if ((db.volunteerActivities || []).length === before) return false;
    await persist(db);
    return true;
  });
}

/** Full database snapshot for admin download / disaster recovery. */
export async function exportDatabaseSnapshot(): Promise<DatabaseShape> {
  return ensureDb();
}

/** Admin recovery: import a bloodlink.json / store backup blob. */
export async function restoreDatabaseFromBackup(
  raw: unknown,
): Promise<{ donorCount: number }> {
  if (!raw || typeof raw !== "object") {
    throw new Error("Backup must be a JSON object");
  }
  const parsed = raw as Partial<DatabaseShape>;
  if (!Array.isArray(parsed.donors)) {
    throw new Error("Backup missing donors array");
  }

  const hydrated = await hydrateParsed(parsed);
  const current = await ensureDb();
  if (
    hydrated.db.donors.length < current.donors.length &&
    current.donors.length > 0
  ) {
    throw new Error(
      `Backup has fewer donors (${hydrated.db.donors.length}) than live data (${current.donors.length}). Refusing restore.`,
    );
  }

  // Keep current admin login if backup admin is incomplete.
  if (!hydrated.db.admin?.passwordHash) {
    hydrated.db.admin = current.admin;
  }

  await persist(hydrated.db);
  return { donorCount: hydrated.db.donors.length };
}

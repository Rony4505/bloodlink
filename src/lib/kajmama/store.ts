import { access, mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import {
  CATEGORIES,
  COMMISSION_PCT,
  DEFAULT_ADMIN_BANKS,
  DEFAULT_ADMIN_MOBILES,
  DEFAULT_ADS,
  DEFAULT_OWNER_PIN,
  DEFAULT_PACKAGES,
} from "./constants";
import { expirePackages, siteFeeOf } from "./premium";
import { createSeedStore } from "./seed";
import { BUSY_BOOKING_STATUSES, type Booking, type Job, type KajmamaStore, type Review, type User } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "kajmama-store.json");

let writeChain: Promise<void> = Promise.resolve();

async function ensureDir() {
  try {
    await access(DATA_DIR);
  } catch {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

function normalizeUser(u: User): User {
  return {
    ...u,
    upazila: u.upazila || u.area || "",
    packageId: u.packageId || "basic",
    packageExpiresAt: u.packageExpiresAt ?? null,
    payout: u.payout || {
      bankName: "",
      bankAccount: "",
      bankHolder: u.name || "",
      mobileBanking: "",
      mobileBankingType: "",
    },
  };
}

function normalizeJob(j: Job): Job {
  return { ...j, upazila: j.upazila || j.area || "" };
}

function normalizeBooking(b: Booking, pct: number): Booking {
  const fee = siteFeeOf(b.price || 0, b.commissionPct || pct);
  return {
    ...b,
    commissionPct: b.commissionPct || pct,
    siteFee: b.siteFee ?? fee.siteFee,
    workerPayout: b.workerPayout ?? fee.workerPayout,
  };
}

function normalizeStore(raw: Partial<KajmamaStore> | null | undefined): KajmamaStore {
  const settings = {
    ownerPin: raw?.settings?.ownerPin || DEFAULT_OWNER_PIN,
    siteName: raw?.settings?.siteName || "KajMama BD",
    siteNameBn: raw?.settings?.siteNameBn || "KajMama BD",
    taglineBn: raw?.settings?.taglineBn || "জেলা ও কাজ অনুযায়ী মিস্ত্রি খুঁজুন",
    taglineEn: raw?.settings?.taglineEn || "Find workers by district and job type",
    contactPhone: raw?.settings?.contactPhone || "01712-345678",
    contactEmail: raw?.settings?.contactEmail || "support@kajmamabd.com",
    contactWhatsapp: raw?.settings?.contactWhatsapp || "01712345678",
    contactFacebook: raw?.settings?.contactFacebook || "https://facebook.com/kajmamabd",
    commissionPct: raw?.settings?.commissionPct || COMMISSION_PCT,
    banks: Array.isArray(raw?.settings?.banks) && raw.settings.banks.length ? raw.settings.banks : DEFAULT_ADMIN_BANKS,
    mobiles:
      Array.isArray(raw?.settings?.mobiles) && raw.settings.mobiles.length
        ? raw.settings.mobiles
        : DEFAULT_ADMIN_MOBILES,
  };
  return {
    settings,
    categories: Array.isArray(raw?.categories) && raw.categories.length ? raw.categories : CATEGORIES.map((c) => ({ ...c })),
    packages: Array.isArray(raw?.packages) && raw.packages.length ? raw.packages : DEFAULT_PACKAGES.map((p) => ({ ...p })),
    ads: Array.isArray(raw?.ads) ? raw.ads : DEFAULT_ADS.map((a) => ({ ...a })),
    users: (Array.isArray(raw?.users) ? raw.users : []).map(normalizeUser),
    jobs: (Array.isArray(raw?.jobs) ? raw.jobs : []).map(normalizeJob),
    bookings: (Array.isArray(raw?.bookings) ? raw.bookings : []).map((b) =>
      normalizeBooking(b, settings.commissionPct),
    ),
    messages: Array.isArray(raw?.messages) ? raw.messages : [],
    reviews: Array.isArray(raw?.reviews) ? raw.reviews : [],
    support: Array.isArray(raw?.support) ? raw.support : [],
  };
}

export async function readKajmamaStore(): Promise<KajmamaStore> {
  await ensureDir();
  try {
    const text = await readFile(STORE_PATH, "utf8");
    const store = normalizeStore(JSON.parse(text) as Partial<KajmamaStore>);
    const merged = await mergeMissingDemoData(store);
    if (expirePackages(merged)) await writeKajmamaStore(merged);
    return merged;
  } catch {
    const fresh = createSeedStore();
    await writeKajmamaStore(fresh);
    return fresh;
  }
}

const DEMO_EXTRA_IDS = ["u_imran", "u_jasim", "u_rakib", "u_sohel", "u_babu", "u_lina"];

async function mergeMissingDemoData(store: KajmamaStore): Promise<KajmamaStore> {
  const seed = createSeedStore();
  const missingUsers = DEMO_EXTRA_IDS.some((id) => !store.users.some((u) => u.id === id))
    ? seed.users.filter((u) => !store.users.some((x) => x.id === u.id || x.phone === u.phone))
    : [];
  const missingReviews = seed.reviews.filter((r) => !store.reviews.some((x) => x.id === r.id));
  const settingsNeedBrand =
    store.settings.siteName === "Kajmama" || store.settings.contactPhone === "01700000000";
  const needCats = store.categories.length === 0;
  const needPkgs = store.packages.length === 0;
  const missingAds = seed.ads.filter((a) => !store.ads.some((x) => x.id === a.id));
  const seedPremiumIds = seed.users.filter((u) => u.role === "worker" && u.packageId !== "basic").map((u) => u.id);
  let users = missingUsers.length ? [...store.users, ...missingUsers] : store.users;
  let pkgPatched = false;
  users = users.map((u) => {
    if (seedPremiumIds.includes(u.id) && (u.packageId === "basic" || !u.packageId)) {
      pkgPatched = true;
      const seeded = seed.users.find((x) => x.id === u.id);
      return seeded
        ? { ...u, packageId: seeded.packageId, packageExpiresAt: seeded.packageExpiresAt, payout: u.payout?.bankAccount ? u.payout : seeded.payout }
        : u;
    }
    return u;
  });
  if (
    missingUsers.length === 0 &&
    missingReviews.length === 0 &&
    !settingsNeedBrand &&
    !needCats &&
    !needPkgs &&
    !pkgPatched &&
    missingAds.length === 0
  ) {
    return store;
  }
  const next: KajmamaStore = {
    ...store,
    users,
    reviews: missingReviews.length ? [...store.reviews, ...missingReviews] : store.reviews,
    categories: needCats ? seed.categories : store.categories,
    packages: needPkgs ? seed.packages : store.packages,
    ads: missingAds.length ? [...store.ads, ...missingAds] : store.ads,
    settings: settingsNeedBrand
      ? {
          ...store.settings,
          siteName: "KajMama BD",
          siteNameBn: "KajMama BD",
          taglineBn: "জেলা ও কাজ অনুযায়ী মিস্ত্রি খুঁজুন",
          taglineEn: "Find workers by district and job type",
          contactPhone: store.settings.contactPhone === "01700000000" ? "01712-345678" : store.settings.contactPhone,
        }
      : store.settings,
  };
  await writeKajmamaStore(next);
  return next;
}

export async function writeKajmamaStore(store: KajmamaStore): Promise<void> {
  await ensureDir();
  const temp = `${STORE_PATH}.${process.pid}.tmp`;
  await writeFile(temp, JSON.stringify(store, null, 2), "utf8");
  await rename(temp, STORE_PATH);
}

export async function updateKajmamaStore(
  mutator: (store: KajmamaStore) => KajmamaStore | void,
): Promise<KajmamaStore> {
  const run = writeChain.then(async () => {
    const store = await readKajmamaStore();
    expirePackages(store);
    const result = mutator(store);
    const next = result || store;
    await writeKajmamaStore(next);
    return next;
  });
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function findUser(store: KajmamaStore, id: string): User | undefined {
  return store.users.find((u) => u.id === id);
}

export function findUserByPhone(store: KajmamaStore, phone: string): User | undefined {
  return store.users.find((u) => u.phone === phone);
}

export function findJob(store: KajmamaStore, id: string): Job | undefined {
  return store.jobs.find((j) => j.id === id);
}

export function findBooking(store: KajmamaStore, id: string): Booking | undefined {
  return store.bookings.find((b) => b.id === id);
}

export function ratingFor(store: KajmamaStore, userId: string): { rating: number; reviewCount: number } {
  const list = store.reviews.filter((r) => r.toUserId === userId);
  if (list.length === 0) return { rating: 0, reviewCount: 0 };
  const sum = list.reduce((acc, r) => acc + r.rating, 0);
  return { rating: Math.round((sum / list.length) * 10) / 10, reviewCount: list.length };
}

export function reviewsFor(store: KajmamaStore, userId: string): Review[] {
  return store.reviews
    .filter((r) => r.toUserId === userId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function storeCategories(store: KajmamaStore) {
  return store.categories.length ? store.categories : CATEGORIES;
}

export function categoriesWithCounts(store: KajmamaStore) {
  return storeCategories(store).map((c) => ({
    ...c,
    workerCount: store.users.filter(
      (u) => u.role === "worker" && !u.blocked && u.skills.includes(c.id),
    ).length,
  }));
}

export function workerIsBusy(store: KajmamaStore, workerId: string): boolean {
  return store.bookings.some((b) => b.workerId === workerId && BUSY_BOOKING_STATUSES.includes(b.status));
}

export function setWorkerAvailability(store: KajmamaStore, workerId: string) {
  const u = findUser(store, workerId);
  if (!u || u.role !== "worker") return;
  u.available = !workerIsBusy(store, workerId);
}

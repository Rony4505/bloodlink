import { access, mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { CATEGORIES, COMMISSION_PCT, DEFAULT_OWNER_PIN } from "./constants";
import { createSeedStore } from "./seed";
import type { Booking, Job, KajmamaStore, Review, User } from "./types";

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

function normalizeStore(raw: Partial<KajmamaStore> | null | undefined): KajmamaStore {
  return {
    settings: {
      ownerPin: raw?.settings?.ownerPin || DEFAULT_OWNER_PIN,
      siteName: raw?.settings?.siteName || "KajMama BD",
      siteNameBn: raw?.settings?.siteNameBn || "KajMama BD",
      taglineBn: raw?.settings?.taglineBn || "জেলা ও কাজ অনুযায়ী মিস্ত্রি খুঁজুন",
      taglineEn: raw?.settings?.taglineEn || "Find workers by district and job type",
      contactPhone: raw?.settings?.contactPhone || "01712-345678",
      commissionPct: raw?.settings?.commissionPct || COMMISSION_PCT,
    },
    users: Array.isArray(raw?.users) ? raw.users : [],
    jobs: Array.isArray(raw?.jobs) ? raw.jobs : [],
    bookings: Array.isArray(raw?.bookings) ? raw.bookings : [],
    messages: Array.isArray(raw?.messages) ? raw.messages : [],
    reviews: Array.isArray(raw?.reviews) ? raw.reviews : [],
  };
}

export async function readKajmamaStore(): Promise<KajmamaStore> {
  await ensureDir();
  try {
    const text = await readFile(STORE_PATH, "utf8");
    const store = normalizeStore(JSON.parse(text) as Partial<KajmamaStore>);
    return mergeMissingDemoData(store);
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
  if (missingUsers.length === 0 && missingReviews.length === 0 && !settingsNeedBrand) return store;
  const next: KajmamaStore = {
    ...store,
    users: missingUsers.length ? [...store.users, ...missingUsers] : store.users,
    reviews: missingReviews.length ? [...store.reviews, ...missingReviews] : store.reviews,
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

export function publicCategories() {
  return CATEGORIES;
}

export function categoriesWithCounts(store: KajmamaStore) {
  return CATEGORIES.map((c) => ({
    ...c,
    workerCount: store.users.filter(
      (u) => u.role === "worker" && !u.blocked && u.skills.includes(c.id),
    ).length,
  }));
}

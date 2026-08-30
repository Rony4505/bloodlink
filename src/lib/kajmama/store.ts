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
      siteName: raw?.settings?.siteName || "Kajmama",
      siteNameBn: raw?.settings?.siteNameBn || "কাজমামা",
      taglineBn: raw?.settings?.taglineBn || "কাজ লাগলে মামা আছে।",
      taglineEn: raw?.settings?.taglineEn || "Work needed? Mama is here.",
      contactPhone: raw?.settings?.contactPhone || "01700000000",
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
    return normalizeStore(JSON.parse(text) as Partial<KajmamaStore>);
  } catch {
    const fresh = createSeedStore();
    await writeKajmamaStore(fresh);
    return fresh;
  }
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

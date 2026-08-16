import { access, mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { ensureMatchXi } from "./lineup";
import { createEmptyStore, DEFAULT_OWNER_PIN } from "./seed";
import type { CricketStore, Match, Tenant } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "cricket-store.json");

async function ensureDir() {
  try {
    await access(DATA_DIR);
  } catch {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

function normalizeStore(raw: Partial<CricketStore> | null | undefined): CricketStore {
  const base = createEmptyStore();
  if (!raw) return base;
  const tenants = Array.isArray(raw.tenants) && raw.tenants.length > 0 ? raw.tenants : base.tenants;
  const matches = (Array.isArray(raw.matches) ? raw.matches : base.matches).map((m) =>
    ensureMatchXi(m as Match),
  );
  return {
    settings: {
      ownerPin: raw.settings?.ownerPin || DEFAULT_OWNER_PIN,
      siteName: raw.settings?.siteName || base.settings.siteName,
      tagline: raw.settings?.tagline || base.settings.tagline,
      contactPhone: raw.settings?.contactPhone || base.settings.contactPhone,
    },
    tenants,
    matches,
  };
}

export async function readCricketStore(): Promise<CricketStore> {
  await ensureDir();
  try {
    const text = await readFile(STORE_PATH, "utf8");
    return normalizeStore(JSON.parse(text) as Partial<CricketStore>);
  } catch {
    const fresh = createEmptyStore();
    await writeCricketStore(fresh);
    return fresh;
  }
}

export async function writeCricketStore(store: CricketStore): Promise<void> {
  await ensureDir();
  const temp = `${STORE_PATH}.${process.pid}.tmp`;
  const payload = JSON.stringify(store, null, 2);
  await writeFile(temp, payload, "utf8");
  await rename(temp, STORE_PATH);
}

export async function updateCricketStore(
  mutator: (store: CricketStore) => CricketStore | void,
): Promise<CricketStore> {
  const store = await readCricketStore();
  const result = mutator(store);
  const next = result || store;
  await writeCricketStore(next);
  return next;
}

export function findTenantBySlug(store: CricketStore, slug: string): Tenant | undefined {
  return store.tenants.find((t) => t.slug.toLowerCase() === slug.toLowerCase());
}

export function findTenantById(store: CricketStore, id: string): Tenant | undefined {
  return store.tenants.find((t) => t.id === id);
}

export function findMatch(store: CricketStore, matchId: string): Match | undefined {
  const m = store.matches.find((x) => x.id === matchId);
  return m ? ensureMatchXi(m) : undefined;
}

export function matchesForTenant(store: CricketStore, tenantId: string): Match[] {
  return store.matches
    .filter((m) => m.tenantId === tenantId)
    .map(ensureMatchXi)
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
}

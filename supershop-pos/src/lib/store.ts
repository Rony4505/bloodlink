import { promises as fs } from "fs";
import path from "path";
import { createSeedData } from "./seed";
import type { StoreData } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

let writeQueue: Promise<void> = Promise.resolve();

async function ensureStore(): Promise<StoreData> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as StoreData;
  } catch {
    const seed = await createSeedData();
    await fs.writeFile(DATA_FILE, JSON.stringify(seed, null, 2), "utf8");
    return seed;
  }
}

export async function readStore(): Promise<StoreData> {
  return ensureStore();
}

export async function updateStore(
  mutator: (data: StoreData) => StoreData | Promise<StoreData>,
): Promise<StoreData> {
  const run = writeQueue.then(async () => {
    const current = await ensureStore();
    const next = await mutator(structuredClone(current));
    await fs.writeFile(DATA_FILE, JSON.stringify(next, null, 2), "utf8");
    return next;
  });
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

import path from "path";

/** Prefer Railway Volume (`DATA_DIR=/app/data`) so store data survives redeploys. */
export function fashionDataDir(): string {
  const configured = process.env.DATA_DIR?.trim();
  if (configured) return path.resolve(configured);
  return path.join(/* turbopackIgnore: true */ process.cwd(), "data");
}

export function fashionStorePath(): string {
  return path.join(/* turbopackIgnore: true */ fashionDataDir(), "fashion-store.json");
}

export function fashionUploadDir(): string {
  return path.join(/* turbopackIgnore: true */ fashionDataDir(), "uploads", "fashion");
}

export function fashionUploadUrl(filename: string): string {
  return `/api/fashion/files/${filename}`;
}

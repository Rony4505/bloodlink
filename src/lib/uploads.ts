import { existsSync, mkdirSync } from "fs";
import path from "path";

export function uploadsDir(): string {
  const configured = process.env["DATA_DIR"];
  const base =
    configured && configured.trim()
      ? path.isAbsolute(configured)
        ? configured
        : path.join(process.cwd(), configured)
      : path.join(process.cwd(), "data");
  const dir = path.join(base, "uploads");
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function uploadFilePath(name: string): string | null {
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) return null;
  const dir = path.resolve(uploadsDir());
  const full = path.resolve(dir, name);
  if (full !== dir && !full.startsWith(dir + path.sep)) return null;
  if (!existsSync(full)) return null;
  return full;
}

export function contentTypeForName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

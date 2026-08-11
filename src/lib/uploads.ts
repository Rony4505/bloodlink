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

export type DetectedImage = {
  mime: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  ext: "jpg" | "png" | "webp" | "gif";
};

/** Detect image type from magic bytes, MIME, or filename (mobile often sends empty type). */
export function detectImageType(
  buffer: Buffer,
  mimeHint: string,
  filename: string,
): DetectedImage | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { mime: "image/png", ext: "png" };
  }
  if (
    buffer.length >= 6 &&
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return { mime: "image/gif", ext: "gif" };
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return { mime: "image/webp", ext: "webp" };
  }

  // HEIC/HEIF from iPhone — not supported without conversion
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 4, 8) === "ftyp" &&
    /heic|heif|mif1|msf1/i.test(buffer.toString("ascii", 8, 12))
  ) {
    return null;
  }

  const hint = (mimeHint || "").toLowerCase().trim();
  if (hint === "image/jpeg" || hint === "image/jpg") return { mime: "image/jpeg", ext: "jpg" };
  if (hint === "image/png") return { mime: "image/png", ext: "png" };
  if (hint === "image/webp") return { mime: "image/webp", ext: "webp" };
  if (hint === "image/gif") return { mime: "image/gif", ext: "gif" };

  const fromName = filename.split(".").pop()?.toLowerCase() || "";
  if (fromName === "jpg" || fromName === "jpeg") return { mime: "image/jpeg", ext: "jpg" };
  if (fromName === "png") return { mime: "image/png", ext: "png" };
  if (fromName === "webp") return { mime: "image/webp", ext: "webp" };
  if (fromName === "gif") return { mime: "image/gif", ext: "gif" };

  return null;
}

export function isLikelyHeic(buffer: Buffer, mimeHint: string, filename: string): boolean {
  const hint = (mimeHint || "").toLowerCase();
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (hint.includes("heic") || hint.includes("heif") || ext === "heic" || ext === "heif") {
    return true;
  }
  return (
    buffer.length >= 12 &&
    buffer.toString("ascii", 4, 8) === "ftyp" &&
    /heic|heif|mif1|msf1/i.test(buffer.toString("ascii", 8, 12))
  );
}

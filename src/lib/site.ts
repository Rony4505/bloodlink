import { getAppMode } from "@/lib/app-mode";

const BLOODLINK_SITE_URL = "https://bloodlinkbd.org";
const FASHION_SITE_URL = "https://smartcraftcorner.com";

/** Canonical public site URL for the active APP_MODE. */
export function getSiteUrl() {
  const mode = getAppMode();
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (mode === "fashion" ? FASHION_SITE_URL : BLOODLINK_SITE_URL);

  const normalized = raw.replace(/\/$/, "");

  if (mode === "fashion") {
    if (!normalized) return FASHION_SITE_URL;
    // Prefer configured host (custom domain or Railway). Never force BloodLink.
    if (normalized.includes("bloodlinkbd.")) return FASHION_SITE_URL;
    return normalized;
  }

  // BloodLink — never publish the old .com host or a Railway preview host.
  if (
    !normalized ||
    normalized.includes("bloodlinkbd.com") ||
    normalized.includes("up.railway.app") ||
    normalized.includes("railway.internal") ||
    normalized.includes("smartcraftcorner")
  ) {
    return BLOODLINK_SITE_URL;
  }

  return normalized;
}

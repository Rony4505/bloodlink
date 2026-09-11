import { getAppMode, type AppMode } from "@/lib/app-mode";

const BLOODLINK_SITE_URL = "https://bloodlinkbd.org";
const FASHION_SITE_URL = "https://noorzaa.com";

/** Canonical public site URL for the active APP_MODE. */
export function getSiteUrl(modeOverride?: AppMode) {
  const mode = modeOverride ?? getAppMode();
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (mode === "fashion" ? FASHION_SITE_URL : BLOODLINK_SITE_URL);

  const normalized = raw.replace(/\/$/, "");

  if (mode === "fashion") {
    if (!normalized) return FASHION_SITE_URL;
    // Prefer configured host (custom domain or Railway). Never force BloodLink.
    if (normalized.includes("bloodlinkbd.")) return FASHION_SITE_URL;
    // Legacy Smart craft URL → current Noorzaa domain
    if (normalized.includes("smartcraftcorner")) return FASHION_SITE_URL;
    return normalized;
  }

  // BloodLink — never publish the old .com host, fashion domains, or Railway preview.
  if (
    !normalized ||
    normalized.includes("bloodlinkbd.com") ||
    normalized.includes("up.railway.app") ||
    normalized.includes("railway.internal") ||
    normalized.includes("smartcraftcorner") ||
    normalized.includes("noorzaa.com")
  ) {
    return BLOODLINK_SITE_URL;
  }

  return normalized;
}

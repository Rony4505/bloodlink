const BLOODLINK_SITE_URL = "https://bloodlinkbd.org";

/** Canonical public site URL for BloodLink BD. */
export function getSiteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    BLOODLINK_SITE_URL;

  const normalized = raw.replace(/\/$/, "");

  // Never publish the old .com host or a Railway preview host.
  if (
    !normalized ||
    normalized.includes("bloodlinkbd.com") ||
    normalized.includes("up.railway.app") ||
    normalized.includes("railway.internal")
  ) {
    return BLOODLINK_SITE_URL;
  }

  return normalized;
}

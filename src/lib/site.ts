/** Canonical public site — always bloodlinkbd.org for SEO. */
const CANONICAL_SITE_URL = "https://bloodlinkbd.org";

export function getSiteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    CANONICAL_SITE_URL;

  const normalized = raw.replace(/\/$/, "");

  // Never publish the old .com host (or a Railway preview host) in
  // sitemap/robots/canonical — Google must see the live custom domain.
  if (
    !normalized ||
    normalized.includes("bloodlinkbd.com") ||
    normalized.includes("up.railway.app") ||
    normalized.includes("railway.internal")
  ) {
    return CANONICAL_SITE_URL;
  }

  return normalized;
}

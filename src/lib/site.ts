export function getSiteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://bloodlinkbd.org";
  return raw.replace(/\/$/, "");
}

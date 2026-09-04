/** Human-readable URL slug from a name (Latin + Bangla letters kept). */
export function slugifyName(input: string, maxLen = 64): string {
  const slug = String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09FF]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen)
    .replace(/-+$/g, "");
  return slug || "link";
}

/** Pick a unique slug; if taken, append -2, -3, … */
export function uniqueSlug(
  base: string,
  taken: Iterable<string>,
  maxLen = 64,
): string {
  const root = slugifyName(base, maxLen);
  const used = new Set(
    [...taken].map((t) => String(t || "").trim().toLowerCase()).filter(Boolean),
  );
  if (!used.has(root)) return root;
  for (let i = 2; i < 1000; i++) {
    const suffix = `-${i}`;
    const candidate = `${root.slice(0, Math.max(1, maxLen - suffix.length))}${suffix}`;
    if (!used.has(candidate.toLowerCase())) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

/**
 * Old portal tokens were random base64url (~24 chars, no word hyphens).
 * Name-based slugs are shorter or use hyphens between words.
 */
export function looksLikeRandomPortalToken(token: string): boolean {
  const t = String(token || "").trim();
  if (!t) return true;
  if (t.includes("-")) return false;
  return t.length >= 18;
}

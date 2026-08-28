const DEFAULT_SITE = "https://bloodlinkbd.org";

export function siteOrigin(): string {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  return configured || DEFAULT_SITE;
}

export function volunteerJoinPath(token: string): string {
  return `/join/${encodeURIComponent(token)}`;
}

export function volunteerWorkPath(token: string): string {
  return `/work/${encodeURIComponent(token)}`;
}

export function volunteerJoinUrl(token: string, origin = siteOrigin()): string {
  return `${origin}${volunteerJoinPath(token)}`;
}

export function volunteerWorkUrl(token: string, origin = siteOrigin()): string {
  return `${origin}${volunteerWorkPath(token)}`;
}

export function volunteerPushUserId(volunteerId: string): string {
  return `volunteer:${volunteerId}`;
}

export function isVolunteerPushUserId(userId: string): boolean {
  return userId.startsWith("volunteer:");
}

export function volunteerIdFromPushUserId(userId: string): string | null {
  if (!isVolunteerPushUserId(userId)) return null;
  return userId.slice("volunteer:".length) || null;
}

export function formatVolunteerDateTime(iso: string, locale = "bn-BD"): string {
  try {
    return new Date(iso).toLocaleString(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

/** Split token into spoken chunks (e.g. ABCD · EFGH · HIJK). */
export function verbalTokenCode(token: string): string {
  const clean = token.replace(/[^a-zA-Z0-9]/g, "");
  const parts: string[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    parts.push(clean.slice(i, i + 4));
  }
  return parts.join(" · ");
}

export type VolunteerVerbalLink = {
  host: string;
  path: "join" | "work";
  code: string;
  url: string;
};

export function volunteerVerbalLink(
  kind: "join" | "work",
  token: string,
  origin = siteOrigin(),
): VolunteerVerbalLink {
  const host = origin.replace(/^https?:\/\//, "");
  const url = kind === "join" ? volunteerJoinUrl(token, origin) : volunteerWorkUrl(token, origin);
  return {
    host,
    path: kind,
    code: verbalTokenCode(token),
    url,
  };
}

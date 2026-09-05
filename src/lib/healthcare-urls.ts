import { verbalTokenCode } from "@/lib/volunteer-urls";

const DEFAULT_SITE = "https://bloodlinkbd.org";

export function siteOrigin(): string {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  return configured || DEFAULT_SITE;
}

export function healthcareManagePath(token: string): string {
  return `/healthcare/manage/${encodeURIComponent(token)}`;
}

export function healthcareManageUrl(token: string, origin = siteOrigin()): string {
  return `${origin}${healthcareManagePath(token)}`;
}

/** Public patient page — QR codes point here so visitors book this institution. */
export function healthcareCompanyPublicPath(slugOrId: string): string {
  return `/healthcare/c/${encodeURIComponent(slugOrId)}`;
}

export function healthcareCompanyPublicUrl(
  slugOrId: string,
  origin = siteOrigin(),
): string {
  return `${origin}${healthcareCompanyPublicPath(slugOrId)}`;
}

/** Printable reception QR banner (A5 / table-stand). */
export function healthcareCompanyBannerPath(slugOrId: string): string {
  return `${healthcareCompanyPublicPath(slugOrId)}/banner`;
}

export function healthcareCompanyBannerUrl(
  slugOrId: string,
  origin = siteOrigin(),
): string {
  return `${origin}${healthcareCompanyBannerPath(slugOrId)}`;
}

export type HealthcareVerbalLink = {
  host: string;
  path: string;
  code: string;
  url: string;
  friendlyPath: string;
};

export function healthcareVerbalLink(
  token: string,
  origin = siteOrigin(),
): HealthcareVerbalLink {
  const host = origin.replace(/^https?:\/\//, "");
  const friendlyPath = healthcareManagePath(token);
  const url = healthcareManageUrl(token, origin);
  return {
    host,
    path: "healthcare/manage",
    code: verbalTokenCode(token),
    url,
    friendlyPath,
  };
}

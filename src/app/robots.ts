import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";
import { BLOODLINK_OWNER_PATH } from "@/lib/bloodlink-admin-path";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      // Allow uploaded brand assets so Google can fetch logo/favicon candidates.
      allow: ["/", "/api/uploads/"],
      disallow: [
        BLOODLINK_OWNER_PATH,
        "/owner-hq-7f3m",
        "/bl-manage-rony",
        "/admin",
        "/api/",
        "/dashboard",
        "/notifications",
      ],
    },
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}

import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
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

import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = getSiteUrl();
  const now = new Date();

  const paths = [
    "",
    "/find",
    "/ambulance",
    "/register",
    "/login",
    "/requests",
    "/about",
    "/warnings",
    "/privacy",
  ];

  return paths.map((path) => ({
    url: `${site}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/find" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/find" ? 0.9 : 0.7,
  }));
}

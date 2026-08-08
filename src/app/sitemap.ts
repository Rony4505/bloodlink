import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = getSiteUrl();
  const now = new Date();

  return [
    "",
    "/find",
    "/ambulance",
    "/org",
    "/register",
    "/login",
    "/requests",
    "/about",
    "/privacy",
  ].map((path) => ({
    url: `${site}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/find" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/find" || path === "/requests" ? 0.9 : 0.7,
  }));
}

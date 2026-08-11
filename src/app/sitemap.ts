import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = getSiteUrl();
  const now = new Date();

  return [
    "",
    "/find",
    "/ambulance",
    "/register",
    "/login",
    "/requests",
    "/about",
    "/warnings",
    "/privacy",
    "/shop",
    "/collections",
    "/store-admin",
  ].map((path) => ({
    url: `${site}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/find" || path === "/shop" ? "daily" : "weekly",
    priority:
      path === ""
        ? 1
        : path === "/find" || path === "/requests" || path === "/shop"
          ? 0.9
          : 0.7,
  }));
}

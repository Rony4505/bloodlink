import type { MetadataRoute } from "next";
import { getAppMode } from "@/lib/app-mode";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = getSiteUrl();
  const now = new Date();
  const mode = getAppMode();

  const paths =
    mode === "fashion"
      ? ["", "/collections", "/about", "/contact", "/store-admin", "/track", "/cart"]
      : ["", "/find", "/ambulance", "/register", "/login", "/requests", "/about", "/warnings", "/privacy", "/promo"];

  return paths.map((path) => ({
    url: `${site}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/find" || path === "/collections" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/find" || path === "/collections" ? 0.9 : 0.7,
  }));
}

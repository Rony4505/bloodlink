import type { MetadataRoute } from "next";
import { isFashionMode } from "@/lib/app-mode";

export default function manifest(): MetadataRoute.Manifest {
  if (isFashionMode()) {
    return {
      name: "Noorzaa",
      short_name: "Noorzaa",
      description: "Premium women's fashion for Bangladesh.",
      start_url: "/",
      scope: "/",
      display: "standalone",
      orientation: "portrait-primary",
      background_color: "#0a1628",
      theme_color: "#0a1628",
      lang: "bn",
      dir: "ltr",
      categories: ["shopping", "lifestyle"],
      icons: [
        {
          src: "/icon",
          sizes: "64x64",
          type: "image/png",
          purpose: "any",
        },
      ],
    };
  }

  return {
    id: "/",
    name: "BloodLink BD",
    short_name: "BloodLink",
    description:
      "Bangladesh blood donor finder — urgent requests, donors, volunteers, and alerts.",
    start_url: "/?utm_source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait-primary",
    background_color: "#1c0a0c",
    theme_color: "#9b1b2e",
    lang: "bn",
    dir: "ltr",
    categories: ["medical", "health", "social"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Find donors",
        short_name: "Find",
        url: "/find?utm_source=pwa_shortcut",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Notifications",
        short_name: "Alerts",
        url: "/notifications?utm_source=pwa_shortcut",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}

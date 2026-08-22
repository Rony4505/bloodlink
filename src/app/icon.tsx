import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getAppMode } from "@/lib/app-mode";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";
export const runtime = "nodejs";

/** Stable Google-friendly favicon: real brand mark for BloodLink, letter mark for fashion. */
export default async function Icon() {
  const fashion = getAppMode() === "fashion";

  if (!fashion) {
    const file = await readFile(
      path.join(process.cwd(), "public", "icon-192.png"),
    );
    return new Response(file, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #2b1d19 0%, #5c3d34 100%)",
          borderRadius: 36,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 140,
            height: 140,
            borderRadius: 999,
            background: "#f4d4c2",
            color: "#2b1d19",
            fontSize: 84,
            fontWeight: 800,
            letterSpacing: -2,
          }}
        >
          S
        </div>
      </div>
    ),
    { ...size },
  );
}

import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getAppMode } from "@/lib/app-mode";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const runtime = "nodejs";

/** Apple touch + OG-friendly icon; BloodLink uses the real mark on disk. */
export default async function AppleIcon() {
  const fashion = getAppMode() === "fashion";

  if (!fashion) {
    const file = await readFile(
      path.join(process.cwd(), "public", "apple-touch-icon.png"),
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
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: 130,
            height: 130,
            borderRadius: 999,
            background: "#f4d4c2",
            color: "#2b1d19",
          }}
        >
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1 }}>S</div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 2,
              marginTop: 4,
            }}
          >
            CC
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

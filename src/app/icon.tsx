import { ImageResponse } from "next/og";
import { resolveAppMode } from "@/lib/app-mode";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";
export const runtime = "nodejs";

/** Favicon — BloodLink "B" or Noorzaa "N" by Host / APP_MODE. */
export default async function Icon() {
  const fashion = (await resolveAppMode()) === "fashion";

  if (fashion) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(145deg, #0a1628 0%, #1a3a5c 100%)",
            borderRadius: 14,
            color: "#e8eef7",
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: -1,
          }}
        >
          N
        </div>
      ),
      { ...size },
    );
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
          background: "linear-gradient(145deg, #6e1220 0%, #9b1b2e 100%)",
          borderRadius: 14,
          color: "white",
          fontSize: 28,
          fontWeight: 800,
        }}
      >
        B
      </div>
    ),
    { ...size },
  );
}

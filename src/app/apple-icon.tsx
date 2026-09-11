import { ImageResponse } from "next/og";
import { getAppMode } from "@/lib/app-mode";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const runtime = "nodejs";

/** Apple touch icon — BloodLink "B" or Noorzaa "N" by APP_MODE. */
export default function AppleIcon() {
  const fashion = getAppMode() === "fashion";

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
            background: "linear-gradient(145deg, #0a1628 0%, #122d52 55%, #1a3a5c 100%)",
            color: "#e8eef7",
            fontSize: 100,
            fontWeight: 800,
            letterSpacing: -2,
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
          color: "white",
          fontSize: 96,
          fontWeight: 800,
        }}
      >
        B
      </div>
    ),
    { ...size },
  );
}

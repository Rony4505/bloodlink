import { ImageResponse } from "next/og";
import { getAppMode } from "@/lib/app-mode";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";
export const runtime = "nodejs";

export default function Icon() {
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
            background: "linear-gradient(145deg, #2b1d19 0%, #5c3d34 100%)",
            borderRadius: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 46,
              height: 46,
              borderRadius: 999,
              background: "#f4d4c2",
              color: "#2b1d19",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: -1,
            }}
          >
            S
          </div>
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

import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";
export const runtime = "nodejs";

/** Favicon — BloodLink "B". */
export default function Icon() {
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

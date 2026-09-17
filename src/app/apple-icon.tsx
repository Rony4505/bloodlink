import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const runtime = "nodejs";

/** Apple touch icon — BloodLink "B". */
export default function AppleIcon() {
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

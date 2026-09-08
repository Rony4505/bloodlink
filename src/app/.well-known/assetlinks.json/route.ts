import { NextResponse } from "next/server";

/**
 * Digital Asset Links for Android Trusted Web Activity (Play Store).
 *
 * Env:
 * - TWA_PACKAGE_NAME (default org.bloodlinkbd.android)
 * - TWA_SHA256_CERT_FINGERPRINTS — colon-hex SHA-256 from Play App Signing
 *   (comma / whitespace separated if multiple)
 *
 * Spec: https://developers.google.com/digital-asset-links/v1/getting-started
 */
export function GET() {
  const packageName =
    process.env.TWA_PACKAGE_NAME?.trim() || "org.bloodlinkbd.android";

  const raw =
    process.env.TWA_SHA256_CERT_FINGERPRINTS ||
    process.env.TWA_SHA256_FINGERPRINTS ||
    "";
  const fingerprints = raw
    .split(/[\s,]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  const body =
    fingerprints.length === 0
      ? []
      : [
          {
            relation: ["delegate_permission/common.handle_all_urls"],
            target: {
              namespace: "android_app",
              package_name: packageName,
              sha256_cert_fingerprints: fingerprints,
            },
          },
        ];

  return NextResponse.json(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}

import { NextResponse } from "next/server";

const ANDROID_SHA256_CERT_FINGERPRINTS = (process.env.ANDROID_SHA256_CERT_FINGERPRINTS || "")
  .split(",")
  .map((fingerprint) => fingerprint.trim())
  .filter(Boolean);
const ANDROID_APP_LINK_PACKAGE_NAME =
  process.env.ANDROID_APP_LINK_PACKAGE_NAME?.trim() || "com.tymkiwdylan.dev.agroalva";

export function GET() {
  const payload = ANDROID_SHA256_CERT_FINGERPRINTS.length
    ? [
        {
          relation: ["delegate_permission/common.handle_all_urls"],
          target: {
            namespace: "android_app",
            package_name: ANDROID_APP_LINK_PACKAGE_NAME,
            sha256_cert_fingerprints: ANDROID_SHA256_CERT_FINGERPRINTS,
          },
        },
      ]
    : [];

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Type": "application/json",
    },
  });
}

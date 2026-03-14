import { NextResponse } from "next/server";

const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID?.trim();
const IOS_APP_LINK_BUNDLE_ID =
  process.env.IOS_APP_LINK_BUNDLE_ID?.trim() || "com.tymkiwdylan.dev.agroalva";

export function GET() {
  const details = APPLE_TEAM_ID
    ? [
        {
          appID: `${APPLE_TEAM_ID}.${IOS_APP_LINK_BUNDLE_ID}`,
          paths: ["/product/*"],
        },
      ]
    : [];

  return NextResponse.json(
    {
      applinks: {
        apps: [],
        details,
      },
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300",
        "Content-Type": "application/json",
      },
    }
  );
}

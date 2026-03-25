import { nextJsHandler } from "@convex-dev/better-auth/nextjs";

const convexSiteUrl = (process.env.CONVEX_SITE_URL || process.env.NEXT_PUBLIC_CONVEX_SITE_URL || "").replace(/\/$/, "");

const authRouteHandler = nextJsHandler({
  convexSiteUrl,
});

export const { GET, POST } = authRouteHandler;

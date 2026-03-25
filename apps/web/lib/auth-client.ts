"use client"

import { createAuthClient } from "better-auth/react"
import { convexClient } from "@convex-dev/better-auth/client/plugins"

const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL

if (!convexSiteUrl) {
  console.error("NEXT_PUBLIC_CONVEX_SITE_URL is not set. Web auth will not work without it.")
}

export const authClient = createAuthClient({
  baseURL: convexSiteUrl || "https://placeholder.convex.site",
  plugins: [convexClient()],
})

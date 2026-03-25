"use client"

import { ReactNode } from "react"
import { ConvexReactClient, ConvexProvider } from "convex/react"
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react"
import { authClient } from "@/lib/auth-client"

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL

if (!convexUrl) {
  console.error("NEXT_PUBLIC_CONVEX_URL is not set. Web data features will not work without it.")
}

const convex = new ConvexReactClient(convexUrl || "https://placeholder.convex.cloud", {
  expectAuth: false,
  unsavedChangesWarning: false,
})

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <ConvexBetterAuthProvider client={convex} authClient={authClient}>
        {children}
      </ConvexBetterAuthProvider>
    </ConvexProvider>
  )
}

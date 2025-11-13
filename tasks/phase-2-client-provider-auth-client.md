# Phase 2 — Client Provider and Auth Client (Expo)

## Overview
Set up the Expo client-side integration with Convex and Better Auth, including the React provider and auth client.

## Tasks

### 1. Create Auth Client
Create `apps/app/src/lib/auth-client.ts`:

```typescript
import { createAuthClient } from "better-auth/react";
import { convexClient } from "@convex-dev/better-auth/client/plugins";

export const authClient = createAuthClient({
    plugins: [convexClient()],
});
```

This creates the Better Auth client instance that will be used throughout the Expo app for authentication operations.

### 2. Create Convex Client Provider
Create `apps/app/app/ConvexClientProvider.tsx`:

```typescript
"use client";

import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { authClient } from "@/lib/auth-client";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";

const convex = new ConvexReactClient(
    process.env.EXPO_PUBLIC_CONVEX_URL!,
    {
        // Optionally pause queries until the user is authenticated
        expectAuth: true,
    }
);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
    return (
        <ConvexBetterAuthProvider client={convex} authClient={authClient}>
            {children}
        </ConvexBetterAuthProvider>
    );
}
```

**Key Points**:
- Uses `EXPO_PUBLIC_CONVEX_URL` from environment variables
- `expectAuth: true` pauses queries until authentication is established
- `ConvexBetterAuthProvider` syncs Convex client with Better Auth session

### 3. Wrap Root Layout
Update `apps/app/app/_layout.tsx` to wrap the app with `ConvexClientProvider`:

```typescript
import { ConvexClientProvider } from "./ConvexClientProvider";
// ... other imports

export default function RootLayout() {
    return (
        <ConvexClientProvider>
            {/* existing layout content */}
        </ConvexClientProvider>
    );
}
```

**Note**: Make sure to import `ConvexClientProvider` and wrap your existing layout structure.

## Verification Checklist
- [ ] `src/lib/auth-client.ts` created
- [ ] `app/ConvexClientProvider.tsx` created
- [ ] Root layout wrapped with `ConvexClientProvider`
- [ ] Environment variable `EXPO_PUBLIC_CONVEX_URL` is accessible
- [ ] No TypeScript errors
- [ ] App builds and runs without runtime errors

## Notes
- The `expectAuth: true` option means Convex queries will wait for auth before executing
- If you want queries to work before auth, set `expectAuth: false` (you'll handle auth state manually)
- The provider makes `authClient` available throughout the app via React context
- Make sure your import path (`@/lib/auth-client`) matches your TypeScript path configuration

## Next Steps
After completing this phase, you'll be able to:
- Use `authClient` methods (`signIn`, `signUp`, `signOut`, etc.) in components
- Use Convex hooks (`useQuery`, `useMutation`) with authentication
- Access current user session via Better Auth hooks


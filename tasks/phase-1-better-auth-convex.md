# Phase 1 — Better Auth in Convex

## Overview
Install Better Auth packages and configure the Convex backend to handle authentication using the Better Auth component.

## Tasks

### 1. Install Required Packages
In `apps/app/` directory:

```bash
pnpm add better-auth@1.3.27 --save-exact
pnpm add convex@latest @convex-dev/better-auth
```

**Important**: Better Auth version must be exactly `1.3.27` for compatibility with the Convex component.

### 2. Create Convex Config
Create `apps/app/convex/convex.config.ts`:

```typescript
import { defineApp } from "convex/server";
import betterAuth from "@convex-dev/better-auth/convex.config";

const app = defineApp();
app.use(betterAuth);

export default app;
```

This registers the Better Auth component with your Convex app.

### 3. Create Auth Config
Create `apps/app/convex/auth.config.ts`:

```typescript
export default {
    providers: [
        {
            domain: process.env.CONVEX_SITE_URL || process.env.SITE_URL,
            applicationID: "convex",
        },
    ],
};
```

This configures Better Auth to use Convex as the authentication provider.

### 4. Create Auth Module
Create `apps/app/convex/auth.ts`:

```typescript
import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { betterAuth } from "better-auth";

const siteUrl = process.env.SITE_URL!;

// The component client has methods needed for integrating Convex with Better Auth
export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (
    ctx: GenericCtx<DataModel>,
    { optionsOnly } = { optionsOnly: false },
) => {
    return betterAuth({
        // Disable logging when createAuth is called just to generate options
        logger: {
            disabled: optionsOnly,
        },
        baseURL: siteUrl,
        database: authComponent.adapter(ctx),
        // Configure simple, non-verified email/password to get started
        emailAndPassword: {
            enabled: true,
            requireEmailVerification: false,
        },
        plugins: [
            // The Convex plugin is required for Convex compatibility
            convex(),
        ],
    });
};

// Example function for getting the current user
export const getCurrentUser = query({
    args: {},
    handler: async (ctx) => {
        return authComponent.getAuthUser(ctx);
    },
});
```

**Key Points**:
- `authComponent` provides the adapter and helper methods
- `createAuth` creates a Better Auth instance configured for Convex
- `getCurrentUser` is a helper query you can use in other functions

### 5. Register HTTP Routes
Create `apps/app/convex/http.ts`:

```typescript
import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);

export default http;
```

This registers all Better Auth HTTP endpoints (sign in, sign up, etc.) on your Convex deployment.

## Verification Checklist
- [ ] Packages installed successfully
- [ ] `convex.config.ts` created and registered
- [ ] `auth.config.ts` created with correct domain
- [ ] `auth.ts` created with `createAuth` function
- [ ] `http.ts` created and routes registered
- [ ] No TypeScript errors (may require saving files)
- [ ] Convex dev server picks up changes without errors

## Notes
- Some TypeScript errors may appear until files are saved and types regenerate
- The `createAuth` function will be used by Convex functions to access Better Auth server methods
- Better Auth will automatically create necessary database tables when first used
- Keep `convex dev` running to regenerate types automatically


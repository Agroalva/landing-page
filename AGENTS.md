# AGENTS.md

This file contains guidelines for AI agents working in this repository.

## Build/Test/Lint Commands

```bash
# Install dependencies (uses pnpm 10.12.4)
pnpm install

# Development - runs all apps in parallel
pnpm dev

# Production build (uses Turbo)
pnpm build

# Run linting across all packages
pnpm lint

# Type check all packages
pnpm type-check

# Start production server (after build)
pnpm start

# Clean build artifacts
pnpm clean
```

### Per-Package Commands

```bash
# Web app (Next.js 15)
cd apps/web
pnpm dev          # Next.js dev server
pnpm build        # Next.js build
pnpm lint         # Next.js lint
pnpm type-check   # tsc --noEmit

# Mobile app (Expo/React Native)
cd apps/app
pnpm dev          # Expo start
pnpm build        # Expo export
pnpm lint         # Expo lint
pnpm type-check   # tsc --noEmit
pnpm ios          # Run on iOS simulator
pnpm android      # Run on Android emulator
```

### Single Test Execution

No test runner is currently configured. If adding tests, use:
- Web: `pnpm test` (once Jest/Vitest is configured)
- Mobile: `pnpm test` (Jest via Expo)

## Architecture Overview

This is a **pnpm monorepo** managed by **Turborepo** with:

- `apps/web`: Next.js 15 web application (landing page)
- `apps/app`: Expo/React Native mobile app with Convex backend
- `packages/ui`: Shared React UI components
- `packages/utils`: Shared utilities (cn helper, etc.)
- `packages/types`: Shared TypeScript types

## Code Style Guidelines

### TypeScript Configuration

- **Target**: ES2020
- **Module**: ESNext with Bundler resolution
- **Strict mode**: Enabled
- **JSX**: Preserve (handled by Next.js/Expo)

### Import Conventions

```typescript
// External dependencies first
import React from 'react';
import { v } from 'convex/values';

// Workspace packages (use @repo aliases)
import { Button } from '@repo/ui';
import { cn } from '@repo/utils';

// App-specific imports (use @/ aliases)
import { Hero } from '@/components/hero';
import { useAuth } from '@/hooks/use-auth';
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `Hero.tsx`, `UserCard.tsx` |
| Functions | camelCase | `getUserProfile`, `handleSubmit` |
| Constants | UPPER_SNAKE_CASE | `API_ENDPOINT`, `MAX_RETRIES` |
| Files (utils) | kebab-case | `use-session.ts`, `api-client.ts` |
| Type definitions | PascalCase | `UserProfile`, `ApiResponse` |

### Formatting

- **Indentation**: 4 spaces (observed in codebase)
- **Quotes**: Double quotes for JSX/strings
- **Semicolons**: Always include
- **Trailing commas**: Yes (ES5 compatible)

## Convex Backend Guidelines

Always follow these rules when working with the Convex backend in `apps/app/convex/`:

### Function Syntax (MANDATORY)

```typescript
import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const myFunction = query({
    args: { userId: v.string() },
    returns: v.optional(v.id("users")),
    handler: async (ctx, args) => {
        // Implementation
    },
});
```

### Key Rules

1. **Always include validators** for both args and returns
2. **Use `v.null()`** for functions that return nothing
3. **Use internal functions** (`internalQuery`, `internalMutation`, `internalAction`) for private APIs
4. **Use public functions** (`query`, `mutation`, `action`) only for client-facing APIs
5. **Define schema** in `convex/schema.ts` with table validators
6. **Use indexes** instead of `.filter()` for performance
7. **Import types** from `./_generated/dataModel` for `Id<"tableName">`

### Schema Example

```typescript
import { defineTable } from "convex/server";
import { v } from "convex/values";

export const usersTable = defineTable({
    email: v.string(),
    name: v.optional(v.string()),
})
    .index("by_email", ["email"]);
```

## Backend Compatibility (CRITICAL)

**Zero tolerance for breaking changes** - mobile app store reviews take days/weeks.

### Rules

- **Never remove/rename** existing fields or endpoints
- **Never change** the type/meaning of existing fields
- **Always prefer additive changes** that old clients can ignore
- **Handle legacy clients** gracefully (missing new fields)
- **Use versioning/feature flags** for divergent behavior
- **Test against existing clients** before merging

## Error Handling

```typescript
// Convex - return null for expected "not found" cases
const user = await ctx.db.get(args.userId);
if (!user) {
    return null;
}

// Throw for actual errors
if (!isAuthorized) {
    throw new Error("Not authenticated");
}

// React Native - handle gracefully
const { data, error } = await apiCall();
if (error) {
    console.error("API error:", error);
    return null;
}
```

## Path Aliases

| Package | Alias | Target |
|---------|-------|--------|
| Root | `@repo/ui` | `packages/ui` |
| Root | `@repo/utils` | `packages/utils` |
| Root | `@repo/types` | `packages/types` |
| apps/app | `@/*` | `apps/app/*` |
| apps/web | `@/*` | `apps/web/*` |

## Technology Stack

- **Package Manager**: pnpm 10.12.4
- **Monorepo**: Turborepo
- **Web**: Next.js 15, React 19, Tailwind CSS 4
- **Mobile**: Expo ~54, React Native 0.81
- **Backend**: Convex
- **Auth**: Better Auth
- **UI**: Radix UI primitives + custom components
- **Linting**: ESLint 9 with @typescript-eslint/parser
